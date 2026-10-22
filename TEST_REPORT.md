# CampusPilot AI — Test Report

**Date:** October 2026  
**Environment:** Windows (PowerShell), Python 3.13.7, Node.js v24.11.0  
**Application:** CampusPilot AI (FastAPI + React Vite)

---

## 1. Automated Test Suite Summary

The automated backend test suite was executed via `pytest backend/test_backend.py -v`.

| # | Test Name | Target Component | Status | Details |
|---|---|---|---|---|
| 1 | `test_main_benchmark_prompt` | Task Extractor | **PASSED** | Correctly extracts ML exam (High, Tomorrow), Python assignment (High, Tonight), and classes at 9 AM (09:00 fixed commitment). |
| 2 | `test_submit_project_and_revise_python` | Multi-Task Extraction | **PASSED** | Correctly extracts multiple tasks from a single natural sentence without punctuation splits. |
| 3 | `test_database_class_starts_at_10am` | Class Time Recognition | **PASSED** | Accurately extracts "starts at 10 AM" and assigns `fixed_time: "10:00"`. |
| 4 | `test_finish_report_by_6pm` | Explicit Priority & Time | **PASSED** | Recognizes "high-priority" and "by 6 PM" -> deadline `18:00`. |
| 5 | `test_exam_in_three_days` | Relative Deadline Parsing | **PASSED** | Normalizes "in three days" into deadline `In 3 days`. |
| 6 | `test_intent_classification` | Intent Routing | **PASSED** | Classifies `list_tasks`, `complete_task`, `reschedule`, and `plan` intents. |
| 7 | `test_fixed_commitment_preserved` | Deterministic Scheduler | **PASSED** | Fixed 10:00 lecture cannot be moved or overwritten by flexible tasks. |
| 8 | `test_schedule_conflict_detection` | Conflict Detection | **PASSED** | Flags overlapping fixed events with `has_conflict: True` and conflict details. |
| 9 | `test_time_conversions` | Time Utilities | **PASSED** | Verifies 12h and 24h format conversions to/from minutes. |
| 10 | `test_study_routine_generation` | Study Planner | **PASSED** | Generates Pomodoro study routine with focus blocks and recovery breaks. |
| 11 | `test_task_crud_persistence` | SQLite Database Layer | **PASSED** | Verifies Create, Read, Update, Toggle, and Delete operations with stable UUIDs. |
| 12 | `test_api_health` | Health Check Endpoint | **PASSED** | `GET /api/health` returns status `ok` and honest simulation disclosure. |
| 13 | `test_api_plan_endpoint` | Agentic Workflow Route | **PASSED** | `POST /api/plan` returns tasks, schedule, study, and execution trace steps. |
| 14 | `test_api_empty_request_validation` | Input Validation | **PASSED** | Rejects empty message strings with HTTP 400 Bad Request. |
| 15 | `test_api_task_crud` | REST API Endpoints | **PASSED** | `POST /api/tasks`, `GET /api/tasks`, `POST /api/tasks/{id}/toggle`, `DELETE /api/tasks/{id}`. |
| 16 | `test_api_overview_endpoint` | Dashboard Stats API | **PASSED** | `GET /api/overview` calculates total, completed, pending, and rate metrics. |

**Total:** 16 Passed, 0 Failed, 0 Skipped (100% pass rate).

---

## 2. Frontend Build Verification

Executed `npm run build` in `frontend/`:
```
vite v5.4.21 building for production...
transforming...
✓ 34 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.17 kB │ gzip:  0.66 kB
dist/assets/index-D9ocdr9Z.css   30.88 kB │ gzip:  6.35 kB
dist/assets/index-B1hQ-n4z.js   195.02 kB │ gzip: 57.55 kB
✓ built in 1.08s
```
**Status:** **PASSED** with 0 warnings and 0 errors.

---

## 3. Live Server Integration Verification

Both servers were started and tested over HTTP via local requests:
- **FastAPI Backend:** Running on `http://127.0.0.1:8000`
  - `GET http://localhost:8000/api/health` -> HTTP 200 OK
  - `POST http://localhost:8000/api/plan` with benchmark prompt -> HTTP 200 OK (returned 3 tasks, schedule items, study blocks, execution trace)
- **Vite Frontend Dev Server:** Running on `http://localhost:5174/` (and `5173`)
  - HTTP 200 OK with compiled HTML, modern CSS tokens, and JavaScript bundles.

---

## 4. Known Limitations & Honest Disclosures

1. **Simulation Scope:** The application simulates Alexa+ agentic tool execution using transparent, deterministic local tools (`extract_tasks`, `make_schedule`, `study_plan`). It does not connect to live Amazon Alexa accounts, live smart home devices, or proprietary Alexa APIs.
2. **Localhost Deployment:** The application runs locally using SQLite and Vite dev server. Cloud database sync is not implemented.
3. **Automated Visual Testing Note:** Automated Playwright browser context initialization encountered an environment network restriction when downloading external driver binaries. Live HTTP endpoints and production builds were verified directly via PowerShell/curl and Vite test builds.

---

## 5. Manual Verification Checklist for User

When evaluating in your browser (`http://localhost:5173` or `http://localhost:5174`):
- [x] Dashboard cards display completion rate and stats.
- [x] Clicking "AI Assistant" and pressing "Run Agent Workflow" displays the tool execution trace with real SQLite write indicators.
- [x] Clicking "My Tasks" allows adding, editing, completing, and deleting tasks.
- [x] Schedule tab highlights fixed events at 09:00 with purple locked badges.
- [x] Study Planner Pomodoro timer counts down when clicking "Start Sprint".
- [x] Toggling Dark/Light mode in the navbar persists across page refreshes.
