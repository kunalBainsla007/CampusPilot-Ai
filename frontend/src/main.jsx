import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import AssistantView from './components/AssistantView';
import TasksView from './components/TasksView';
import ScheduleView from './components/ScheduleView';
import StudyPlannerView from './components/StudyPlannerView';

const API_BASE = 'http://localhost:8000';
const DEFAULT_PROMPT =
  'I have an ML exam tomorrow, a Python assignment due tonight, and classes at 9 AM. Organize my day.';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('campuspilot_theme') || 'light');

  // Core Data States
  const [message, setMessage] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ online: false, message: 'Checking backend...' });
  const [toast, setToast] = useState(null);

  // Persistence States (seeded from localStorage)
  const [tasks, setTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campuspilot_tasks') || '[]');
    } catch {
      return [];
    }
  });

  const [schedule, setSchedule] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campuspilot_schedule') || '[]');
    } catch {
      return [];
    }
  });

  const [study, setStudy] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('campuspilot_study') || '[]');
    } catch {
      return [];
    }
  });

  // Apply Theme Token
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campuspilot_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync state changes to browser localStorage as safe local cache
  useEffect(() => {
    localStorage.setItem('campuspilot_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('campuspilot_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('campuspilot_study', JSON.stringify(study));
  }, [study]);

  // Initial Startup Sync with FastAPI Backend
  useEffect(() => {
    async function initBackendSync() {
      try {
        const healthRes = await fetch(`${API_BASE}/api/health`);
        if (!healthRes.ok) throw new Error('Backend responded with error');
        const healthData = await healthRes.json();
        setBackendStatus({ online: true, message: `Connected to ${healthData.mode || 'FastAPI'}` });

        // Fetch Tasks from SQLite
        const tasksRes = await fetch(`${API_BASE}/api/tasks`);
        if (tasksRes.ok) {
          const remoteTasks = await tasksRes.json();
          if (remoteTasks && remoteTasks.length > 0) {
            setTasks(remoteTasks);
          } else if (tasks.length > 0) {
            // Migrate local tasks into SQLite
            await fetch(`${API_BASE}/api/tasks/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tasks }),
            });
          }
        }

        // Fetch Schedule from SQLite
        const schedRes = await fetch(`${API_BASE}/api/schedule`);
        if (schedRes.ok) {
          const remoteSched = await schedRes.json();
          if (remoteSched && remoteSched.length > 0) {
            setSchedule(remoteSched);
          }
        }

        // Fetch Study Sessions from SQLite
        const studyRes = await fetch(`${API_BASE}/api/study`);
        if (studyRes.ok) {
          const remoteStudy = await studyRes.json();
          if (remoteStudy && remoteStudy.length > 0) {
            setStudy(remoteStudy);
          }
        }
      } catch (err) {
        setBackendStatus({
          online: false,
          message: 'FastAPI backend is offline (using local storage cache).',
        });
      }
    }

    initBackendSync();
  }, []);

  // Main Agentic Plan Execution Handler
  async function runPlan(promptMessage) {
    const textToRun = promptMessage || message;
    if (!textToRun.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToRun, persist: true }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Backend error during plan execution.');
      }

      const result = await res.json();
      setLastResult(result);

      if (result.tasks) setTasks(result.tasks);
      if (result.schedule) setSchedule(result.schedule);
      if (result.study) setStudy(result.study);

      setBackendStatus({ online: true, message: 'Connected to FastAPI' });
      showToast('Agent tools completed successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Cannot connect to FastAPI backend at http://localhost:8000.');
      setBackendStatus({ online: false, message: 'Backend disconnected' });
      showToast('Backend offline. Run: uvicorn main:app --reload --port 8000', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Task Toggle Status
  async function toggleTask(taskId) {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    );

    if (backendStatus.online) {
      try {
        await fetch(`${API_BASE}/api/tasks/${taskId}/toggle`, { method: 'POST' });
      } catch {
        // Fallback to local storage
      }
    }
  }

  // Add Task Manually
  async function handleAddTask(taskData) {
    const tempId = `task-${Date.now()}`;
    const newTask = {
      id: tempId,
      ...taskData,
      done: false,
      created_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    showToast(`Added task "${newTask.title}"`);

    if (backendStatus.online) {
      try {
        const res = await fetch(`${API_BASE}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        if (res.ok) {
          const saved = await res.json();
          setTasks((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
        }
      } catch {
        // Kept in local state
      }
    }
  }

  // Edit Task
  async function handleEditTask(taskId, updatedData) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updatedData } : t))
    );
    showToast('Task updated successfully.');

    if (backendStatus.online) {
      try {
        await fetch(`${API_BASE}/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
      } catch {
        // Saved in local state
      }
    }
  }

  // Delete Task
  async function handleDeleteTask(taskId) {
    const target = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast(`Deleted "${target?.title || 'task'}"`);

    if (backendStatus.online) {
      try {
        await fetch(`${API_BASE}/api/tasks/${taskId}`, { method: 'DELETE' });
      } catch {
        // Deleted in local state
      }
    }
  }

  // Schedule Event Add
  async function handleAddScheduleEvent(eventData) {
    const newEvent = {
      id: `event-${Date.now()}`,
      ...eventData,
      created_at: new Date().toISOString(),
    };
    const updatedSchedule = [...schedule, newEvent].sort((a, b) => a.time.localeCompare(b.time));
    setSchedule(updatedSchedule);
    showToast('Added schedule event.');

    if (backendStatus.online) {
      try {
        await fetch(`${API_BASE}/api/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSchedule),
        });
      } catch {
        // Saved locally
      }
    }
  }

  // Schedule Event Delete
  async function handleDeleteScheduleEvent(eventId) {
    const updated = schedule.filter((s) => s.id !== eventId);
    setSchedule(updated);
    showToast('Removed schedule event.');

    if (backendStatus.online) {
      try {
        await fetch(`${API_BASE}/api/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      } catch {
        // Saved locally
      }
    }
  }

  // Regenerate Study Routine
  function handleRegenerateStudy() {
    runPlan('Make a realistic study plan with Pomodoro intervals for my upcoming exams.');
    showToast('Regenerating study sprint...');
  }

  const pendingCount = tasks.filter((t) => !t.done).length;
  const conflictCount = schedule.filter((s) => s.has_conflict).length;

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        backendStatus={backendStatus}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Main Container: Sidebar + Content View */}
      <div className="app-body">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          taskCount={tasks.length}
          pendingCount={pendingCount}
          conflictCount={conflictCount}
        />

        <main className="main-content">
          {activeTab === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              schedule={schedule}
              study={study}
              onToggleTask={toggleTask}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenAddTask={() => setActiveTab('tasks')}
            />
          )}

          {activeTab === 'assistant' && (
            <AssistantView
              message={message}
              setMessage={setMessage}
              onGeneratePlan={runPlan}
              loading={loading}
              error={error}
              lastResult={lastResult}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={toggleTask}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView
              schedule={schedule}
              onAddScheduleEvent={handleAddScheduleEvent}
              onDeleteScheduleEvent={handleDeleteScheduleEvent}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'study' && (
            <StudyPlannerView
              study={study}
              onNavigate={(tab) => setActiveTab(tab)}
              onRegenerateStudy={handleRegenerateStudy}
            />
          )}

          <footer className="app-footer">
            <div className="footer-content">
              <span>CampusPilot AI • Alexa+ Track Hackathon Prototype</span>
              <span>Transparent Local Tool Simulation • Zero Paid APIs Required</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
