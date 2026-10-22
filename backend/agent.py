"""
CampusPilot AI - Agent Orchestrator & Tool Execution Layer
Decouples agent workflow, intent routing, and tool coordination from FastAPI routes.
Features honest step-by-step execution logging distinguishing real SQLite persistence
from deterministic simulation tools.
"""

from typing import List, Dict, Any, Optional, Tuple
import database
from extractor import extract_tasks_and_commitments, classify_intent
from scheduler import DeterministicScheduler
from study_planner import generate_study_routine, identify_subjects, get_exam_prep_checklist


class TaskManagerTool:
    """Tool 1: Task Manager - Handles task extraction, CRUD, completion, and DB synchronization."""

    name = "task_manager"

    @staticmethod
    def extract(message: str) -> Tuple[List[Dict[str, Any]], List[str]]:
        tasks, assumptions = extract_tasks_and_commitments(message)
        return tasks, assumptions

    @staticmethod
    def list_pending(db_path: Optional[str] = None) -> List[Dict[str, Any]]:
        all_tasks = database.get_all_tasks(db_path=db_path)
        return [t for t in all_tasks if not t["done"]]

    @staticmethod
    def complete_by_keyword(keyword: str, db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
        all_tasks = database.get_all_tasks(db_path=db_path)
        kw = keyword.lower().strip()
        matched = None
        for t in all_tasks:
            if kw in t["title"].lower() or any(w in t["title"].lower() for w in kw.split()):
                matched = t
                break
        if matched:
            return database.update_task(matched["id"], done=True, db_path=db_path)
        return None

    @staticmethod
    def persist_tasks(tasks: List[Dict[str, Any]], db_path: Optional[str] = None) -> List[Dict[str, Any]]:
        return database.bulk_sync_tasks(tasks, db_path=db_path)


class SchedulePlannerTool:
    """Tool 2: Schedule Planner - Conflict detection, fixed event preservation, flexible distribution."""

    name = "schedule_planner"

    def __init__(self):
        self.scheduler = DeterministicScheduler()

    def build_schedule(
        self,
        tasks: List[Dict[str, Any]],
        existing_events: Optional[List[Dict[str, Any]]] = None,
        db_path: Optional[str] = None,
        persist: bool = True,
    ) -> Dict[str, Any]:
        result = self.scheduler.schedule(tasks, existing_events=existing_events)
        if persist:
            database.save_schedule(result["schedule"], db_path=db_path)
        return result


class StudyPlannerTool:
    """Tool 3: Study Planner - Subject-specific Pomodoro routines, focus/break allocation, and checklists."""

    name = "study_planner"

    @staticmethod
    def build_plan(
        message: str,
        subject: Optional[str] = None,
        db_path: Optional[str] = None,
        persist: bool = True,
    ) -> Dict[str, Any]:
        routine = generate_study_routine(message, subject=subject)
        subjects = identify_subjects(message) if not subject else [subject]
        primary_subject = subjects[0] if subjects else "General Academics"
        checklist = get_exam_prep_checklist(primary_subject)

        if persist:
            database.save_study_sessions(routine, db_path=db_path)

        return {
            "routine": routine,
            "primary_subject": primary_subject,
            "checklist": checklist,
            "total_study_minutes": sum(r["minutes"] for r in routine if r.get("type") == "focus"),
        }


class AgentOrchestrator:
    """
    Main Orchestrator:
    1. Interprets request & determines intent
    2. Coordinates tools sequentially
    3. Persists state to SQLite
    4. Produces transparent execution logs
    """

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path
        self.task_tool = TaskManagerTool()
        self.schedule_tool = SchedulePlannerTool()
        self.study_tool = StudyPlannerTool()

    def process_request(self, message: str, persist: bool = True) -> Dict[str, Any]:
        msg = message.strip()
        if not msg:
            return {
                "summary": "Please enter your classes, assignments, or deadlines to begin planning.",
                "tools_used": [],
                "execution_steps": [],
                "tasks": [],
                "schedule": [],
                "study": [],
                "assumptions": ["Awaiting user input."],
            }

        intent_data = classify_intent(msg)
        intent = intent_data.get("intent", "plan")

        execution_steps = []
        tools_used = []

        # --- INTENT 1: LIST PENDING TASKS ---
        if intent == "list_tasks":
            tools_used.append("task_manager")
            pending = self.task_tool.list_pending(db_path=self.db_path)
            execution_steps.append({
                "step": "Query Pending Tasks",
                "tool": "task_manager",
                "type": "real_database_read",
                "status": "success",
                "details": f"Queried SQLite database: found {len(pending)} pending tasks.",
            })
            summary_text = (
                f"You have {len(pending)} pending tasks in your checklist."
                if pending
                else "All clear! You have no pending tasks right now."
            )
            return {
                "summary": summary_text,
                "tools_used": tools_used,
                "execution_steps": execution_steps,
                "tasks": pending,
                "schedule": database.get_schedule(db_path=self.db_path),
                "study": database.get_study_sessions(db_path=self.db_path),
                "assumptions": ["Retrieved live task records from local SQLite database."],
            }

        # --- INTENT 2: COMPLETE TASK ---
        if intent == "complete_task":
            target = intent_data.get("target", "")
            tools_used.append("task_manager")
            updated = self.task_tool.complete_by_keyword(target, db_path=self.db_path)

            if updated:
                execution_steps.append({
                    "step": "Update Task Status",
                    "tool": "task_manager",
                    "type": "real_database_write",
                    "status": "success",
                    "details": f"Successfully marked task '{updated['title']}' as completed in SQLite.",
                })
                summary_text = f"Marked '{updated['title']}' as completed."
            else:
                execution_steps.append({
                    "step": "Locate Task",
                    "tool": "task_manager",
                    "type": "real_database_read",
                    "status": "warning",
                    "details": f"Could not find an open task matching '{target}'.",
                })
                summary_text = f"Could not find an active task matching '{target}'. Check your task list."

            current_tasks = database.get_all_tasks(db_path=self.db_path)
            return {
                "summary": summary_text,
                "tools_used": tools_used,
                "execution_steps": execution_steps,
                "tasks": current_tasks,
                "schedule": database.get_schedule(db_path=self.db_path),
                "study": database.get_study_sessions(db_path=self.db_path),
                "assumptions": ["Attempted task completion match against stored records."],
            }

        # --- INTENT 3: FULL DAY PLANNING & WORKFLOW ---
        # Step 1: Tool 1 - Task Extraction
        tools_used.append("extract_tasks")
        tasks, assumptions = self.task_tool.extract(msg)
        execution_steps.append({
            "step": "Task Extraction",
            "tool": "task_manager",
            "type": "deterministic_tool",
            "status": "success",
            "details": f"Extracted {len(tasks)} tasks: prioritized deadlines and fixed commitments.",
        })

        # Step 2: Tool 2 - Schedule Planning & Conflict Detection
        wants_schedule = bool(
            intent == "plan" or any(w in msg.lower() for w in ["plan", "schedule", "organize", "day", "class", "time", "routine"])
        )
        schedule_items = []
        conflicts_count = 0

        if wants_schedule:
            tools_used.append("make_schedule")
            sched_result = self.schedule_tool.build_schedule(
                tasks,
                db_path=self.db_path,
                persist=persist,
            )
            schedule_items = sched_result["schedule"]
            conflicts_count = sched_result["conflicts_count"]

            conflict_msg = (
                f"Schedule conflict checked: {conflicts_count} conflict(s) detected!"
                if conflicts_count > 0
                else "Schedule conflict checked: 0 overlaps found. Fixed events preserved."
            )
            execution_steps.append({
                "step": "Schedule Synthesis & Conflict Check",
                "tool": "schedule_planner",
                "type": "deterministic_tool",
                "status": "warning" if conflicts_count > 0 else "success",
                "details": conflict_msg,
            })

        # Step 3: Tool 3 - Study Planning
        wants_study = bool(
            any(w in msg.lower() for w in ["study", "learn", "exam", "revision", "practice", "test", "prepare", "pomodoro", "class"])
        )
        study_routine = []
        if wants_study:
            tools_used.append("study_plan")
            study_result = self.study_tool.build_plan(
                msg,
                db_path=self.db_path,
                persist=persist,
            )
            study_routine = study_result["routine"]
            execution_steps.append({
                "step": "Study Routine Generation",
                "tool": "study_planner",
                "type": "deterministic_tool",
                "status": "success",
                "details": f"Generated {len(study_routine)} Pomodoro study blocks for {study_result['primary_subject']}.",
            })

        # Step 4: Real Database Persistence
        saved_tasks = tasks
        if persist:
            saved_tasks = self.task_tool.persist_tasks(tasks, db_path=self.db_path)
            execution_steps.append({
                "step": "Data Persistence",
                "tool": "sqlite_storage",
                "type": "real_database_write",
                "status": "success",
                "details": f"Successfully persisted {len(saved_tasks)} tasks to local SQLite storage.",
            })

        # Step 5: Summary Generation
        summary = (
            f"Organized {len(saved_tasks)} task(s) and structured your schedule. "
            f"{'Found and highlighted scheduling conflicts. ' if conflicts_count > 0 else ''}"
            "Review your tasks, timeline, and study blocks below."
        )

        return {
            "summary": summary,
            "tools_used": tools_used,
            "execution_steps": execution_steps,
            "tasks": saved_tasks,
            "schedule": schedule_items,
            "study": study_routine,
            "assumptions": assumptions,
        }
