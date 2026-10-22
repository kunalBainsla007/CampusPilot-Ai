"""
CampusPilot AI - FastAPI Backend Server
Alexa+ Inspired Agentic Productivity Assistant (Transparent Rule-Based Simulation)
Provides plan generation, task lifecycle CRUD, deterministic scheduling, and SQLite persistence.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

import database
from agent import AgentOrchestrator


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the SQLite database tables on startup
    database.init_db()
    yield


app = FastAPI(
    title="CampusPilot AI - Alexa+ Inspired Agentic Assistant",
    description="Deterministic tool-based student productivity assistant with real SQLite persistence.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS configuration - strict to local frontend development hosts
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = AgentOrchestrator()


# --- Pydantic Request / Response Models ---
class PlanRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Student request or instructions")
    persist: Optional[bool] = Field(default=True, description="Whether to store generated tasks to SQLite")


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    priority: Optional[str] = Field(default="Normal")
    deadline: Optional[str] = Field(default="Not specified")
    done: Optional[bool] = Field(default=False)
    fixed_time: Optional[str] = None
    subject: Optional[str] = None
    estimated_minutes: Optional[int] = Field(default=30)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    priority: Optional[str] = None
    done: Optional[bool] = None
    deadline: Optional[str] = None
    fixed_time: Optional[str] = None
    subject: Optional[str] = None
    estimated_minutes: Optional[int] = None


class ScheduleEventCreate(BaseModel):
    time: str
    end_time: Optional[str] = None
    activity: str
    is_fixed: Optional[bool] = False
    duration_minutes: Optional[int] = 60
    has_conflict: Optional[bool] = False
    conflict_details: Optional[str] = None


class BatchSyncRequest(BaseModel):
    tasks: List[Dict[str, Any]]


# --- Routes ---

@app.post("/api/plan")
def create_plan(req: PlanRequest):
    """
    Main Agentic Workflow Endpoint.
    Interprets natural language, runs deterministic tools, persists to SQLite,
    and returns transparent execution logs.
    """
    msg = req.message.strip()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request message cannot be empty.",
        )

    result = orchestrator.process_request(msg, persist=req.persist if req.persist is not None else True)
    return result


@app.get("/api/tasks")
def list_tasks():
    """Fetch all tasks from SQLite database."""
    return database.get_all_tasks()


@app.post("/api/tasks", status_code=status.HTTP_201_CREATED)
def add_task(task_in: TaskCreate):
    """Manually add a task into SQLite."""
    created = database.create_task(
        title=task_in.title,
        priority=task_in.priority or "Normal",
        deadline=task_in.deadline or "Not specified",
        done=task_in.done or False,
        fixed_time=task_in.fixed_time,
        subject=task_in.subject,
        estimated_minutes=task_in.estimated_minutes or 30,
    )
    return created


@app.put("/api/tasks/{task_id}")
def edit_task(task_id: str, task_in: TaskUpdate):
    """Update details of an existing task."""
    updated = database.update_task(
        task_id=task_id,
        title=task_in.title,
        priority=task_in.priority,
        done=task_in.done,
        deadline=task_in.deadline,
        fixed_time=task_in.fixed_time,
        subject=task_in.subject,
        estimated_minutes=task_in.estimated_minutes,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found.",
        )
    return updated


@app.post("/api/tasks/{task_id}/toggle")
def toggle_task_status(task_id: str):
    """Toggle the completion status of a task."""
    updated = database.toggle_task(task_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found.",
        )
    return updated


@app.delete("/api/tasks/{task_id}")
def remove_task(task_id: str):
    """Delete a task from the database."""
    success = database.delete_task(task_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found.",
        )
    return {"status": "deleted", "id": task_id}


@app.post("/api/tasks/sync")
def sync_browser_tasks(req: BatchSyncRequest):
    """Batch imports or synchronizes tasks (useful for localStorage migration)."""
    saved = database.bulk_sync_tasks(req.tasks)
    return {"status": "synced", "count": len(saved), "tasks": saved}


@app.get("/api/schedule")
def get_current_schedule():
    """Retrieve saved schedule timeline."""
    return database.get_schedule()


@app.post("/api/schedule")
def save_schedule_events(events: List[ScheduleEventCreate]):
    """Save or update full schedule timeline."""
    raw_events = [e.model_dump() for e in events]
    saved = database.save_schedule(raw_events)
    return {"status": "saved", "count": len(saved), "schedule": saved}


@app.get("/api/study")
def get_study_routine():
    """Retrieve current study sessions."""
    return database.get_study_sessions()


@app.get("/api/overview")
def get_dashboard_overview():
    """Retrieve statistical summary for dashboard cards."""
    return database.get_overview()


@app.get("/api/health")
def health_check():
    """System health check."""
    return {
        "status": "ok",
        "app": "CampusPilot AI",
        "mode": "transparent rule-based simulation + local SQLite persistence",
        "version": "2.0.0",
    }
