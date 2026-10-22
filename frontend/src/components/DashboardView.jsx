import React from 'react';
import {
  SparklesIcon,
  CheckSquareIcon,
  CalendarIcon,
  ClockIcon,
  AlertTriangleIcon,
  PlusIcon,
  CheckIcon,
} from './Icons';

export default function DashboardView({
  tasks,
  schedule,
  study,
  onToggleTask,
  onNavigate,
  onOpenAddTask,
}) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.done).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const dueTodayTasks = tasks.filter(
    (t) => !t.done && (t.deadline?.toLowerCase().includes('tonight') || t.deadline?.toLowerCase().includes('today'))
  );

  const upcomingTasks = tasks.filter(
    (t) => !t.done && !dueTodayTasks.some((dt) => dt.id === t.id)
  );

  const conflictCount = schedule.filter((s) => s.has_conflict).length;

  return (
    <div className="view-container">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-eyebrow">DAILY PILOT • {today.toUpperCase()}</div>
          <h2>Welcome back, Scholar</h2>
          <p>
            {pendingTasks > 0
              ? `You have ${pendingTasks} pending task${pendingTasks > 1 ? 's' : ''} to accomplish today. Stay focused and conquer your deadlines!`
              : "All caught up! Use the AI Assistant to plan your next study sprint or assignment."}
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => onNavigate('assistant')}>
              <SparklesIcon size={16} /> Open AI Assistant
            </button>
            <button className="btn btn-secondary" onClick={onOpenAddTask}>
              <PlusIcon size={16} /> Add Task Manually
            </button>
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-header">
            <span>Task Completion</span>
            <strong>{completionRate}%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${completionRate}%` }}></div>
          </div>
          <div className="progress-legend">
            <span>{completedTasks} completed</span>
            <span>{pendingTasks} remaining</span>
          </div>
        </div>
      </div>

      {/* Conflict Notice if any */}
      {conflictCount > 0 && (
        <div className="alert-banner warning">
          <AlertTriangleIcon size={20} className="alert-icon" />
          <div className="alert-text">
            <strong>Schedule Overlap Detected ({conflictCount})</strong>
            <p>One or more fixed activities overlap in your schedule. Review the Schedule tab to resolve them.</p>
          </div>
          <button className="btn btn-sm btn-warning" onClick={() => onNavigate('schedule')}>
            View Conflicts
          </button>
        </div>
      )}

      {/* Grid of Key Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <CheckSquareIcon size={20} />
          </div>
          <div className="stat-details">
            <div className="stat-value">{pendingTasks}</div>
            <div className="stat-label">Pending Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper red">
            <ClockIcon size={20} />
          </div>
          <div className="stat-details">
            <div className="stat-value">{dueTodayTasks.length}</div>
            <div className="stat-label">Due Today / Tonight</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <CalendarIcon size={20} />
          </div>
          <div className="stat-details">
            <div className="stat-value">{schedule.length}</div>
            <div className="stat-label">Scheduled Events</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <CheckIcon size={20} />
          </div>
          <div className="stat-details">
            <div className="stat-value">{completedTasks}</div>
            <div className="stat-label">Completed Tasks</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Tasks & Schedule Timeline Preview */}
      <div className="dashboard-columns">
        {/* Left Column: Tasks Due Today & High Priority */}
        <div className="card dashboard-card">
          <div className="card-header">
            <div className="card-title-group">
              <h3>Urgent Tasks Due Today</h3>
              <span className="badge badge-urgent">{dueTodayTasks.length} Urgent</span>
            </div>
            <button className="btn-link" onClick={() => onNavigate('tasks')}>
              Manage All Tasks &rarr;
            </button>
          </div>

          <div className="card-body">
            {dueTodayTasks.length === 0 ? (
              <div className="empty-state">
                <CheckIcon size={32} className="text-muted" />
                <p>No urgent tasks due today! Check upcoming deadlines.</p>
              </div>
            ) : (
              <div className="task-list">
                {dueTodayTasks.map((task) => (
                  <div key={task.id} className="task-row">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => onToggleTask(task.id)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <div className="task-info">
                      <span className={`task-title ${task.done ? 'completed' : ''}`}>
                        {task.title}
                      </span>
                      <div className="task-meta">
                        <span className="badge badge-priority-high">{task.priority} Priority</span>
                        <span className="meta-deadline">⏰ {task.deadline}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {upcomingTasks.length > 0 && (
              <div className="upcoming-preview-section">
                <h4>Upcoming Deadlines</h4>
                <div className="task-list">
                  {upcomingTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="task-row compact">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => onToggleTask(task.id)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="task-info">
                        <span className={`task-title ${task.done ? 'completed' : ''}`}>{task.title}</span>
                        <div className="task-meta">
                          <span className="meta-deadline">{task.deadline}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Schedule Preview */}
        <div className="card dashboard-card">
          <div className="card-header">
            <div className="card-title-group">
              <h3>Today's Schedule</h3>
              <span className="badge badge-neutral">{schedule.length} Events</span>
            </div>
            <button className="btn-link" onClick={() => onNavigate('schedule')}>
              Full Timeline &rarr;
            </button>
          </div>

          <div className="card-body">
            {schedule.length === 0 ? (
              <div className="empty-state">
                <CalendarIcon size={32} className="text-muted" />
                <p>No activities scheduled yet. Ask the AI Assistant to organize your day!</p>
                <button className="btn btn-sm btn-primary" onClick={() => onNavigate('assistant')}>
                  Generate Schedule
                </button>
              </div>
            ) : (
              <div className="timeline-preview">
                {schedule.slice(0, 5).map((item) => (
                  <div key={item.id} className={`timeline-row ${item.is_fixed ? 'fixed-event' : ''} ${item.has_conflict ? 'conflict' : ''}`}>
                    <div className="timeline-time">
                      <strong>{item.time}</strong>
                      {item.end_time && <span className="time-end">{item.end_time}</span>}
                    </div>
                    <div className="timeline-marker">
                      <span className={`marker-dot ${item.is_fixed ? 'fixed' : 'flexible'}`}></span>
                      <span className="marker-line"></span>
                    </div>
                    <div className="timeline-content">
                      <span className="timeline-title">{item.activity}</span>
                      <div className="timeline-badges">
                        {item.is_fixed ? (
                          <span className="badge badge-fixed">Fixed Class / Event</span>
                        ) : (
                          <span className="badge badge-flexible">Flexible Slot</span>
                        )}
                        {item.has_conflict && (
                          <span className="badge badge-conflict">Overlap Conflict</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
