# CampusPilot AI — Project Audit & Modernization Plan

**Date:** October 2026  
**Auditor:** Senior Full-Stack & Agentic AI Architect  
**Project:** CampusPilot AI (Alexa+ Inspired Agentic Productivity Assistant)

---

## 1. Existing Architecture

```
campuspilot-ai/
├── backend/
│   ├── main.py              # Monolithic FastAPI app (router + parsing + tools in one file)
│   ├── requirements.txt     # fastapi, uvicorn, pydantic
│   └── .venv/               # Python 3.13 virtual environment
├── frontend/
│   ├── package.json         # React 18, Vite 5
│   ├── index.html           # Minimal HTML shell
│   └── src/
│       ├── main.jsx         # Monolithic single-file React component
│       └── style.css        # Basic CSS
├── README.md                # Minimal starter documentation
└── .gitignore               # Standard ignores (.env, node_modules, .venv)
```

### Current Request/Response Contract (`POST /api/plan`)
- **Request:** `{"message": string}`
- **Response:**
  ```json
  {
    "summary": string,
    "tools_used": string[],
    "tasks": [
      { "title": string, "priority": "High" | "Normal", "done": boolean, "deadline": string, "fixed_time"?: string }
    ],
    "schedule": [
      { "time": string, "activity": string }
    ],
    "study": [
      { "minutes": number, "activity": string }
    ]
  }
  ```
- **Health Check:** `GET /api/health` -> `{"status": "ok", "mode": "transparent rule-based simulation"}`

---

## 2. Features Already Working
1. **Core Prompt Parsing:** Correctly parses `"I have an ML exam tomorrow, a Python assignment due tonight, and classes at 9 AM. Organize my day."`
2. **Priority Assignment:** Prioritizes Python assignment due tonight over tomorrow's ML exam; preserves 9 AM class.
3. **Suggested Schedule Slots:** Distributes flexible tasks across available default time slots.
4. **Study Routine Generation:** Generates a 4-step Pomodoro sequence for identified subjects.
5. **Basic Persistence:** Frontend stores task items in browser `localStorage`.
6. **Build Integrity:** Frontend builds cleanly with Vite (`vite build` passes).

---

## 3. Discovered Problems & Limitations

### Backend & AI Agent
1. **Coupled Monolith:** Parsing logic, tool definitions, and HTTP route handlers are in a single `main.py` file without modular separation.
2. **Fragile Regex Task Extraction:** Splitting or parsing falls apart for real student prompts (e.g. "submit project today and revise Python tomorrow", "Database class at 10 AM, schedule 2 study sessions", "Add high-priority task...").
3. **No Conversational Intent / Tool Routing:** Every request routes through the same fixed function pipeline rather than inspecting intent (e.g. task creation vs. schedule generation vs. query vs. task completion).
4. **No True Server-Side Persistence:** Tasks are generated statelessly and client-side array indices are used as identifiers. There is no SQLite database for persistent task lifecycle, updates, or query.
5. **Rigid Schedule Algorithm:** Fixed slots (`08:00`, `10:30`, etc.) do not calculate task durations, do not handle overlapping fixed events, and cannot flag scheduling conflicts.
6. **No Automated Tests:** Zero backend unit tests or API integration tests exist.

### Frontend & UX
1. **Single-File Compressed React Code:** `main.jsx` contains the whole app in one component with cryptic variable names.
2. **Missing Application Views:** Lacks structured areas required for a full productivity app:
   - Dashboard (stats, due today, completion overview)
   - AI Assistant (chat feed, suggested prompts, step-by-step tool execution inspector)
   - My Tasks (CRUD: add, edit, filter, delete, mark complete with stable IDs)
   - Schedule (conflict visualization, timeline view, distinction between fixed & flexible)
   - Study Planner (interactive Pomodoro breakdown, exam checklists, progress tracking)
3. **Styling & Accessibility:** Lacks dark mode, lacks clear empty/loading states, lacks keyboard accessibility, lacks mobile sidebar/drawer navigation.

---

## 4. Planned Changes

| Phase | Planned Implementation |
|---|---|
| **Phase 2: Frontend Architecture** | Clean modular React structure with Tailwind/Vanilla CSS design system: Dashboard, Assistant, Task Manager, Schedule Timeline, and Study Planner with dark/light mode and mobile navigation. |
| **Phase 3 & 4: Agent & Tools** | Modular Agent Orchestrator with 3 decoupled tools (`TaskManager`, `SchedulePlanner`, `StudyPlanner`). Robust intent classifier & deterministic rule-based natural language parser + pluggable provider interface. |
| **Phase 5: Data Persistence** | Python built-in `sqlite3` data access layer with stable UUIDs, task CRUD API endpoints, and automatic localStorage data migration. |
| **Phase 6: Deterministic Scheduling** | Time-slot conflict detection, duration estimation, fixed event preservation, and clear overlap warnings. |
| **Phase 7: Security & Reliability** | Pydantic v2 schemas, strict CORS origins, `.env.example`, graceful offline fallback, and friendly error alerts. |
| **Phase 8: Automated Testing** | Pytest test suite covering task extraction, schedule conflict detection, intent classification, SQLite CRUD, and API response contracts. |
| **Phase 9: Presentation & Demo** | Comprehensive `README.md`, `PROJECT_OVERVIEW.md`, `DEMO_SCRIPT.md`, and Mermaid architecture diagram. |

---

## 5. Track Eligibility & Rules Verification

- **Hackathon:** "Build, Ship, Shape: Amazon Developer Hackathon" (Devpost).
- **Track Focus:** Alexa+ track (simulated agentic workflows, MCP/tool-calling personal assistants).
- **Mandatory Requirements:**
  - Public demo video under 3 minutes.
  - Transparent disclosure of what is simulated (rule-based local tools) vs. live integrations.
  - No claims of real Alexa cloud, real smart-home control, or unauthorized proprietary APIs without real implementation.
  - Open-source, cleanly runnable on standard local developer machines (Windows/macOS/Linux).
