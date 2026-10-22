"""
CampusPilot AI - Automated Backend Test Suite
Tests natural language extraction, deterministic scheduling, conflict detection,
SQLite persistence, and API endpoint contracts.
"""

import os
import pytest
from fastapi.testclient import TestClient

import database
from main import app
from extractor import extract_tasks_and_commitments, classify_intent
from scheduler import DeterministicScheduler, parse_time_to_minutes, minutes_to_time_str
from study_planner import generate_study_routine, identify_subjects

TEST_DB = "test_campuspilot.db"


@pytest.fixture(autouse=True)
def setup_test_db():
    if os.path.exists(TEST_DB):
        try:
            os.remove(TEST_DB)
        except PermissionError:
            pass
    database.init_db(TEST_DB)
    yield
    if os.path.exists(TEST_DB):
        try:
            os.remove(TEST_DB)
        except PermissionError:
            pass


@pytest.fixture
def client():
    return TestClient(app)


# --- 1. Task Extraction Benchmark Tests ---

def test_main_benchmark_prompt():
    """
    Main Required Example:
    'I have an ML exam tomorrow, a Python assignment due tonight, and classes at 9 AM. Organize my day.'
    """
    prompt = "I have an ML exam tomorrow, a Python assignment due tonight, and classes at 9 AM. Organize my day."
    tasks, assumptions = extract_tasks_and_commitments(prompt)

    assert len(tasks) == 3, f"Expected 3 tasks, got {len(tasks)}"

    # Task 1: Python assignment due tonight
    python_task = next((t for t in tasks if "python" in t["title"].lower() or "assignment" in t["title"].lower()), None)
    assert python_task is not None
    assert python_task["priority"] == "High"
    assert python_task["deadline"] == "Tonight"
    assert python_task["done"] is False

    # Task 2: Machine Learning exam tomorrow
    ml_task = next((t for t in tasks if "machine learning" in t["title"].lower() or "ml" in t["title"].lower()), None)
    assert ml_task is not None
    assert ml_task["priority"] == "High"
    assert ml_task["deadline"] == "Tomorrow"

    # Task 3: Classes at 9 AM (fixed commitment)
    class_task = next((t for t in tasks if "class" in t["title"].lower()), None)
    assert class_task is not None
    assert class_task["fixed_time"] == "09:00"
    assert class_task["deadline"] == "09:00"


def test_submit_project_and_revise_python():
    prompt = "I need to submit my project today and revise Python tomorrow."
    tasks, _ = extract_tasks_and_commitments(prompt)

    proj_task = next((t for t in tasks if "project" in t["title"].lower()), None)
    assert proj_task is not None
    assert proj_task["deadline"] == "Today"

    revise_task = next((t for t in tasks if "revise" in t["title"].lower() and "python" in t["title"].lower()), None)
    assert revise_task is not None
    assert revise_task["deadline"] == "Tomorrow"


def test_database_class_starts_at_10am():
    prompt = "My database class starts at 10 AM. Schedule two study sessions around it."
    tasks, _ = extract_tasks_and_commitments(prompt)

    db_class = next((t for t in tasks if "database" in t["title"].lower() or "class" in t["title"].lower()), None)
    assert db_class is not None
    assert db_class["fixed_time"] == "10:00"


def test_finish_report_by_6pm():
    prompt = "Add a high-priority task to finish my report by 6 PM."
    tasks, _ = extract_tasks_and_commitments(prompt)

    report_task = next((t for t in tasks if "report" in t["title"].lower()), None)
    assert report_task is not None
    assert report_task["priority"] == "High"
    assert report_task["deadline"] == "18:00"


def test_exam_in_three_days():
    prompt = "I have an exam in three days. Help me prepare."
    tasks, _ = extract_tasks_and_commitments(prompt)

    exam_task = next((t for t in tasks if "exam" in t["title"].lower()), None)
    assert exam_task is not None
    assert "In 3 days" in exam_task["deadline"]


# --- 2. Intent Classification Tests ---

def test_intent_classification():
    assert classify_intent("Show my pending tasks")["intent"] == "list_tasks"
    assert classify_intent("Mark the Python assignment as complete")["intent"] == "complete_task"
    assert classify_intent("Move my study session to 5 PM")["intent"] == "reschedule"
    assert classify_intent("I have no fixed schedule today. Make a realistic study plan.")["intent"] == "plan"


# --- 3. Deterministic Scheduling & Conflict Detection Tests ---

def test_fixed_commitment_preserved():
    scheduler = DeterministicScheduler()
    tasks = [
        {"id": "1", "title": "Database Lecture", "fixed_time": "10:00", "estimated_minutes": 60},
        {"id": "2", "title": "Homework", "fixed_time": None, "priority": "High", "estimated_minutes": 60},
    ]
    res = scheduler.schedule(tasks)
    schedule = res["schedule"]

    lecture = next(s for s in schedule if s["activity"] == "Database Lecture")
    assert lecture["time"] == "10:00"
    assert lecture["end_time"] == "11:00"
    assert lecture["is_fixed"] is True

    # Homework must NOT overwrite 10:00-11:00
    hw = next(s for s in schedule if s["activity"] == "Homework")
    assert hw["time"] != "10:00"
    assert res["conflicts_count"] == 0


def test_schedule_conflict_detection():
    scheduler = DeterministicScheduler()
    tasks = [
        {"id": "1", "title": "Team Meeting", "fixed_time": "09:00", "estimated_minutes": 60},
        {"id": "2", "title": "Chemistry Lab", "fixed_time": "09:30", "estimated_minutes": 60},
    ]
    res = scheduler.schedule(tasks)
    assert res["conflicts_count"] >= 1
    assert any(s["has_conflict"] for s in res["schedule"])


def test_time_conversions():
    assert parse_time_to_minutes("09:00") == 540
    assert parse_time_to_minutes("9 AM") == 540
    assert parse_time_to_minutes("6 PM") == 1080
    assert parse_time_to_minutes("18:00") == 1080
    assert minutes_to_time_str(540) == "09:00"
    assert minutes_to_time_str(1080) == "18:00"


# --- 4. Study Planner Tests ---

def test_study_routine_generation():
    routine = generate_study_routine("Prepare for Machine Learning exam")
    assert len(routine) >= 4
    assert any(r["type"] == "break" for r in routine)
    assert any("Machine Learning" in r["activity"] for r in routine)


# --- 5. SQLite Persistence Tests ---

def test_task_crud_persistence():
    # Create
    task = database.create_task(
        title="Complete Linear Algebra Homework",
        priority="High",
        deadline="Tomorrow",
        db_path=TEST_DB,
    )
    assert task["id"] is not None
    assert task["done"] is False

    # Read
    tasks = database.get_all_tasks(db_path=TEST_DB)
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Complete Linear Algebra Homework"

    # Update
    updated = database.update_task(task["id"], done=True, db_path=TEST_DB)
    assert updated["done"] is True

    # Toggle
    toggled = database.toggle_task(task["id"], db_path=TEST_DB)
    assert toggled["done"] is False

    # Delete
    del_ok = database.delete_task(task["id"], db_path=TEST_DB)
    assert del_ok is True
    assert len(database.get_all_tasks(db_path=TEST_DB)) == 0


# --- 6. API Endpoints Tests ---

def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "simulation" in data["mode"]


def test_api_plan_endpoint(client):
    res = client.post(
        "/api/plan",
        json={"message": "I have an ML exam tomorrow, a Python assignment due tonight, and classes at 9 AM. Organize my day."},
    )
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "tools_used" in data
    assert "tasks" in data
    assert "schedule" in data
    assert "study" in data
    assert "execution_steps" in data
    assert len(data["tasks"]) == 3


def test_api_empty_request_validation(client):
    res = client.post("/api/plan", json={"message": "   "})
    assert res.status_code == 422 or res.status_code == 400


def test_api_task_crud(client):
    # Create task
    res = client.post("/api/tasks", json={"title": "Test Task", "priority": "High", "deadline": "Tonight"})
    assert res.status_code == 201
    created = res.json()
    task_id = created["id"]

    # List tasks
    res_list = client.get("/api/tasks")
    assert res_list.status_code == 200
    assert any(t["id"] == task_id for t in res_list.json())

    # Toggle task
    res_toggle = client.post(f"/api/tasks/{task_id}/toggle")
    assert res_toggle.status_code == 200
    assert res_toggle.json()["done"] is True

    # Delete task
    res_del = client.delete(f"/api/tasks/{task_id}")
    assert res_del.status_code == 200


def test_api_overview_endpoint(client):
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_tasks" in data
    assert "completed_tasks" in data
    assert "completion_rate" in data
