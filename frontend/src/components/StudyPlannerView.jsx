import React, { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  RotateCcwIcon,
  CheckIcon,
  SparklesIcon,
} from './Icons';

export default function StudyPlannerView({
  study,
  onNavigate,
  onRegenerateStudy,
}) {
  // Pomodoro interactive timer state
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const currentSession = study[activeSessionIndex] || (study.length > 0 ? study[0] : null);
  const initialSeconds = currentSession ? currentSession.minutes * 60 : 25 * 60;

  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  // Sync timer when session changes
  useEffect(() => {
    if (currentSession) {
      setTimeLeft(currentSession.minutes * 60);
      setIsRunning(false);
    }
  }, [activeSessionIndex, study]);

  // Timer interval countdown
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      // Automatically advance to next session if available
      if (activeSessionIndex < study.length - 1) {
        setActiveSessionIndex((prev) => prev + 1);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, activeSessionIndex, study.length]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    if (currentSession) {
      setTimeLeft(currentSession.minutes * 60);
    } else {
      setTimeLeft(25 * 60);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Exam Preparation Checklist State
  const defaultChecklist = [
    { id: 1, text: 'Review lecture slide summaries and syllabus topics', done: true },
    { id: 2, text: 'Draft 1-page formula & high-yield definitions cheat sheet', done: false },
    { id: 3, text: 'Solve past exam questions under 30-min timed conditions', done: false },
    { id: 4, text: 'Diagnose tricky edge-case mistakes from practice problems', done: false },
    { id: 5, text: 'Feynman technique test: explain core concepts aloud without notes', done: false },
  ];

  const [checklist, setChecklist] = useState(defaultChecklist);

  const toggleChecklistItem = (id) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const totalFocusMinutes = study
    .filter((s) => s.type === 'focus' || !s.type)
    .reduce((acc, curr) => acc + (curr.minutes || 0), 0);

  const checklistProgress = Math.round(
    (checklist.filter((c) => c.done).length / checklist.length) * 100
  );

  return (
    <div className="view-container">
      {/* Header Bar */}
      <div className="section-header-bar">
        <div>
          <h2>Study Planner & Pomodoro Sprint</h2>
          <p className="subtitle">
            Subject-tailored active recall intervals, Pomodoro focus blocks, and high-yield exam preparation checklists.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => onRegenerateStudy()}>
          <SparklesIcon size={16} /> Regenerate Study Routine
        </button>
      </div>

      {/* Top Split: Interactive Pomodoro Timer + Study Metrics */}
      <div className="study-grid-top">
        {/* Interactive Timer Card */}
        <div className="card timer-card">
          <div className="timer-header">
            <span className="pill pill-primary">
              {currentSession?.type === 'break' ? '☕ Rest Interval' : '🔥 Focus Interval'}
            </span>
            <span className="timer-session-label">
              Block {study.length > 0 ? activeSessionIndex + 1 : 1} of {study.length || 1}
            </span>
          </div>

          <div className="timer-display">
            <h1 className="countdown-text">{formatTimer(timeLeft)}</h1>
            <p className="active-activity-label">
              {currentSession ? currentSession.activity : 'Review key concepts & formulas'}
            </p>
          </div>

          <div className="timer-controls">
            <button
              className={`btn btn-lg ${isRunning ? 'btn-warning' : 'btn-primary'}`}
              onClick={toggleTimer}
            >
              {isRunning ? (
                <>
                  <PauseIcon size={18} /> Pause
                </>
              ) : (
                <>
                  <PlayIcon size={18} /> Start Sprint
                </>
              )}
            </button>
            <button className="btn btn-lg btn-secondary" onClick={resetTimer} title="Reset Timer">
              <RotateCcwIcon size={18} /> Reset
            </button>
          </div>
        </div>

        {/* Study Strategy & Metrics Card */}
        <div className="card strategy-card">
          <div className="card-header">
            <h3>Planned Study Time</h3>
            <span className="badge badge-primary">{totalFocusMinutes} Minutes Total</span>
          </div>
          <div className="card-body">
            <p className="strategy-desc">
              Based on the Pomodoro cognitive technique, breaking study into 25-35 minute focused blocks with brief 5-minute pauses increases knowledge retention by up to 40%.
            </p>

            <div className="checklist-progress-bar">
              <div className="progress-header">
                <span>Exam Readiness Score</span>
                <strong>{checklistProgress}%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${checklistProgress}%` }}></div>
              </div>
            </div>

            <div className="study-quick-tips">
              <strong>💡 Pro Tip for Hackathons & Exams:</strong>
              <p>Active recall and self-testing beat re-reading notes every time. Solve problems before checking solutions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pomodoro Routine Sequence */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <BookOpenIcon size={18} className="text-primary" />
            <h3>Generated Study Interval Sequence</h3>
          </div>
          <span className="badge badge-neutral">{study.length} Intervals Planned</span>
        </div>
        <div className="card-body">
          {study.length === 0 ? (
            <div className="empty-state">
              <ClockIcon size={36} className="text-muted" />
              <p>No study intervals active. Generate a study routine with the AI Assistant!</p>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('assistant')}>
                Open Assistant
              </button>
            </div>
          ) : (
            <div className="study-intervals-list">
              {study.map((item, idx) => {
                const isSelected = idx === activeSessionIndex;
                const isBreak = item.type === 'break' || item.activity.toLowerCase().includes('break');
                return (
                  <div
                    key={item.id || idx}
                    className={`study-interval-card ${isSelected ? 'selected' : ''} ${
                      isBreak ? 'break-card' : 'focus-card'
                    }`}
                    onClick={() => setActiveSessionIndex(idx)}
                  >
                    <div className="interval-left">
                      <span className="interval-index">{idx + 1}</span>
                      <div className="interval-info">
                        <strong>{item.activity}</strong>
                        <span className="interval-tag">
                          {isBreak ? 'Recovery Break' : item.type === 'review' ? 'Active Recall / Test' : 'Deep Focus Block'}
                        </span>
                      </div>
                    </div>
                    <div className="interval-right">
                      <span className="interval-time">
                        <ClockIcon size={14} /> {item.minutes} min
                      </span>
                      {isSelected && <span className="badge badge-primary">Active Now</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Exam Prep Checklist */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <CheckIcon size={18} className="text-primary" />
            <h3>Exam Preparation Checklist</h3>
          </div>
          <span className="badge badge-neutral">
            {checklist.filter((c) => c.done).length} / {checklist.length} Completed
          </span>
        </div>
        <div className="card-body">
          <div className="exam-checklist">
            {checklist.map((item) => (
              <label key={item.id} className="checklist-item">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleChecklistItem(item.id)}
                />
                <span className="checkmark"></span>
                <span className={`checklist-text ${item.done ? 'strikethrough' : ''}`}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
