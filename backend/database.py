"""
CampusPilot AI - Database Layer (SQLite)
Uses Python's standard sqlite3 module for zero-dependency, reliable local persistence.
Stores tasks, schedule events, and study sessions with stable UUIDs.
"""

import sqlite3
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "campuspilot.db"))


def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    target_path = db_path or DB_PATH
    conn = sqlite3.connect(target_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Optional[str] = None):
    """Initializes the database schema if tables do not exist."""
    conn = get_connection(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'Normal',
            done INTEGER NOT NULL DEFAULT 0,
            deadline TEXT NOT NULL DEFAULT 'Not specified',
            fixed_time TEXT,
            subject TEXT,
            estimated_minutes INTEGER NOT NULL DEFAULT 30,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schedule_events (
            id TEXT PRIMARY KEY,
            time TEXT NOT NULL,
            end_time TEXT,
            activity TEXT NOT NULL,
            is_fixed INTEGER NOT NULL DEFAULT 0,
            duration_minutes INTEGER NOT NULL DEFAULT 60,
            has_conflict INTEGER NOT NULL DEFAULT 0,
            conflict_details TEXT,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS study_sessions (
            id TEXT PRIMARY KEY,
            subject TEXT NOT NULL,
            minutes INTEGER NOT NULL,
            activity TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def row_to_task(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "title": row["title"],
        "priority": row["priority"],
        "done": bool(row["done"]),
        "deadline": row["deadline"],
        "fixed_time": row["fixed_time"],
        "subject": row["subject"],
        "estimated_minutes": row["estimated_minutes"],
        "created_at": row["created_at"],
    }


def create_task(
    title: str,
    priority: str = "Normal",
    deadline: str = "Not specified",
    done: bool = False,
    fixed_time: Optional[str] = None,
    subject: Optional[str] = None,
    estimated_minutes: int = 30,
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    task_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    conn = get_connection(db_path)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO tasks (id, title, priority, done, deadline, fixed_time, subject, estimated_minutes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
        (
            task_id,
            title.strip(),
            priority,
            1 if done else 0,
            deadline,
            fixed_time,
            subject,
            estimated_minutes,
            now,
        ),
    )
    conn.commit()
    conn.close()

    return {
        "id": task_id,
        "title": title.strip(),
        "priority": priority,
        "done": done,
        "deadline": deadline,
        "fixed_time": fixed_time,
        "subject": subject,
        "estimated_minutes": estimated_minutes,
        "created_at": now,
    }


def get_all_tasks(db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks ORDER BY done ASC, created_at DESC")
    rows = cursor.fetchall()
    tasks = [row_to_task(r) for r in rows]
    conn.close()
    return tasks


def get_task_by_id(task_id: str, db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    row = cursor.fetchone()
    conn.close()
    return row_to_task(row) if row else None


def update_task(
    task_id: str,
    title: Optional[str] = None,
    priority: Optional[str] = None,
    done: Optional[bool] = None,
    deadline: Optional[str] = None,
    fixed_time: Optional[str] = None,
    subject: Optional[str] = None,
    estimated_minutes: Optional[int] = None,
    db_path: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    existing = get_task_by_id(task_id, db_path=db_path)
    if not existing:
        return None

    new_title = title.strip() if title is not None else existing["title"]
    new_priority = priority if priority is not None else existing["priority"]
    new_done = 1 if (done if done is not None else existing["done"]) else 0
    new_deadline = deadline if deadline is not None else existing["deadline"]
    new_fixed_time = fixed_time if fixed_time is not None else existing["fixed_time"]
    new_subject = subject if subject is not None else existing["subject"]
    new_minutes = estimated_minutes if estimated_minutes is not None else existing["estimated_minutes"]

    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE tasks
        SET title = ?, priority = ?, done = ?, deadline = ?, fixed_time = ?, subject = ?, estimated_minutes = ?
        WHERE id = ?
    """,
        (new_title, new_priority, new_done, new_deadline, new_fixed_time, new_subject, new_minutes, task_id),
    )
    conn.commit()
    conn.close()

    return get_task_by_id(task_id, db_path=db_path)


def delete_task(task_id: str, db_path: Optional[str] = None) -> bool:
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def toggle_task(task_id: str, db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    task = get_task_by_id(task_id, db_path=db_path)
    if not task:
        return None
    return update_task(task_id, done=not task["done"], db_path=db_path)


def bulk_sync_tasks(tasks_data: List[Dict[str, Any]], db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Saves a batch of tasks from the agent or frontend.
    If a task doesn't have an ID, one is generated.
    """
    saved_tasks = []
    for item in tasks_data:
        task_id = item.get("id") or str(uuid.uuid4())
        existing = get_task_by_id(task_id, db_path=db_path)
        if existing:
            saved = update_task(
                task_id,
                title=item.get("title"),
                priority=item.get("priority"),
                done=item.get("done"),
                deadline=item.get("deadline"),
                fixed_time=item.get("fixed_time"),
                subject=item.get("subject"),
                estimated_minutes=item.get("estimated_minutes"),
                db_path=db_path,
            )
            if saved:
                saved_tasks.append(saved)
        else:
            saved = create_task(
                title=item.get("title", "Untitled Task"),
                priority=item.get("priority", "Normal"),
                deadline=item.get("deadline", "Not specified"),
                done=item.get("done", False),
                fixed_time=item.get("fixed_time"),
                subject=item.get("subject"),
                estimated_minutes=item.get("estimated_minutes", 30),
                db_path=db_path,
            )
            saved_tasks.append(saved)
    return saved_tasks


def get_schedule(db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM schedule_events ORDER BY time ASC")
    rows = cursor.fetchall()
    events = [
        {
            "id": r["id"],
            "time": r["time"],
            "end_time": r["end_time"],
            "activity": r["activity"],
            "is_fixed": bool(r["is_fixed"]),
            "duration_minutes": r["duration_minutes"],
            "has_conflict": bool(r["has_conflict"]),
            "conflict_details": r["conflict_details"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]
    conn.close()
    return events


def save_schedule(events: List[Dict[str, Any]], db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM schedule_events")
    now = datetime.now().isoformat()
    saved_events = []

    for ev in events:
        event_id = ev.get("id") or str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO schedule_events (id, time, end_time, activity, is_fixed, duration_minutes, has_conflict, conflict_details, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                event_id,
                ev["time"],
                ev.get("end_time"),
                ev["activity"],
                1 if ev.get("is_fixed") else 0,
                ev.get("duration_minutes", 60),
                1 if ev.get("has_conflict") else 0,
                ev.get("conflict_details"),
                now,
            ),
        )
        saved_events.append({
            "id": event_id,
            "time": ev["time"],
            "end_time": ev.get("end_time"),
            "activity": ev["activity"],
            "is_fixed": bool(ev.get("is_fixed")),
            "duration_minutes": ev.get("duration_minutes", 60),
            "has_conflict": bool(ev.get("has_conflict")),
            "conflict_details": ev.get("conflict_details"),
            "created_at": now,
        })

    conn.commit()
    conn.close()
    return saved_events


def get_study_sessions(db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM study_sessions ORDER BY created_at ASC")
    rows = cursor.fetchall()
    sessions = [
        {
            "id": r["id"],
            "subject": r["subject"],
            "minutes": r["minutes"],
            "activity": r["activity"],
            "completed": bool(r["completed"]),
            "created_at": r["created_at"],
        }
        for r in rows
    ]
    conn.close()
    return sessions


def save_study_sessions(sessions: List[Dict[str, Any]], db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM study_sessions")
    now = datetime.now().isoformat()
    saved = []

    for s in sessions:
        session_id = s.get("id") or str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO study_sessions (id, subject, minutes, activity, completed, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """,
            (
                session_id,
                s.get("subject", "General"),
                s["minutes"],
                s["activity"],
                1 if s.get("completed") else 0,
                now,
            ),
        )
        saved.append({
            "id": session_id,
            "subject": s.get("subject", "General"),
            "minutes": s["minutes"],
            "activity": s["activity"],
            "completed": bool(s.get("completed")),
            "created_at": now,
        })

    conn.commit()
    conn.close()
    return saved


def get_overview(db_path: Optional[str] = None) -> Dict[str, Any]:
    tasks = get_all_tasks(db_path=db_path)
    schedule = get_schedule(db_path=db_path)
    study = get_study_sessions(db_path=db_path)

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t["done"])
    pending_tasks = total_tasks - completed_tasks
    high_priority = sum(1 for t in tasks if not t["done"] and t["priority"] == "High")
    due_today = sum(1 for t in tasks if not t["done"] and any(w in t["deadline"].lower() for w in ["tonight", "today"]))
    conflicts_count = sum(1 for s in schedule if s.get("has_conflict"))

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "high_priority": high_priority,
        "due_today": due_today,
        "schedule_count": len(schedule),
        "study_sessions_count": len(study),
        "conflicts_count": conflicts_count,
        "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0),
    }
