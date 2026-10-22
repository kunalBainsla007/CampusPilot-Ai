import React, { useState } from 'react';
import {
  SparklesIcon,
  CheckIcon,
  ClockIcon,
  CalendarIcon,
  BookOpenIcon,
  AlertTriangleIcon,
} from './Icons';

export default function AssistantView({
  message,
  setMessage,
  onGeneratePlan,
  loading,
  error,
  lastResult,
  onNavigate,
}) {
  const suggestedPrompts = [
    {
      label: 'Benchmark Prompt (ML + Python + 9 AM)',
      text: 'I have an ML exam tomorrow, a Python assignment due tonight, and classes at 9 AM. Organize my day.',
    },
    {
      label: 'Multi-Task Project & Revision',
      text: 'I need to submit my project today and revise Python tomorrow.',
    },
    {
      label: 'Class Schedule with Sessions',
      text: 'My database class starts at 10 AM. Schedule two study sessions around it.',
    },
    {
      label: 'High-Priority Report',
      text: 'Add a high-priority task to finish my report by 6 PM.',
    },
    {
      label: 'Exam Prep in 3 Days',
      text: 'I have an exam in three days. Help me prepare.',
    },
    {
      label: 'Show Pending Tasks',
      text: 'Show my pending tasks.',
    },
    {
      label: 'Complete Python Assignment',
      text: 'Mark the Python assignment as complete.',
    },
  ];

  const handlePromptClick = (promptText) => {
    setMessage(promptText);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    onGeneratePlan(message);
  };

  return (
    <div className="view-container">
      {/* Assistant Header Card */}
      <div className="assistant-hero">
        <div className="assistant-hero-header">
          <div className="hero-icon-pill">
            <SparklesIcon size={20} />
            <span>Alexa+ Agent Simulator</span>
          </div>
          <h2>Agentic Student Assistant</h2>
          <p>
            Describe your classes, deadlines, and study goals in natural language.
            The assistant plans and invokes local tools (<span className="code-tag">extract_tasks</span>, <span className="code-tag">make_schedule</span>, <span className="code-tag">study_plan</span>) to create an actionable, conflict-checked plan.
          </p>
        </div>

        {/* Suggested Prompt Chips */}
        <div className="prompt-chips-wrapper">
          <div className="chips-title">SUGGESTED HACKATHON TEST PROMPTS:</div>
          <div className="prompt-chips">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="chip-btn"
                onClick={() => handlePromptClick(p.text)}
                title="Click to insert this prompt"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat-style Input Area */}
        <form onSubmit={handleSubmit} className="assistant-form">
          <div className="input-box-wrapper">
            <textarea
              className="assistant-textarea"
              placeholder="e.g. I have an ML exam tomorrow, a Python assignment due tonight, and classes at 9 AM. Organize my day."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              aria-label="Describe your schedule, tasks, or study goals"
            />
            <div className="input-actions-bar">
              <span className="char-count">{message.length} characters</span>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !message.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Orchestrating Tools…</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon size={16} />
                    <span>Run Agent Workflow</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="error-banner">
            <AlertTriangleIcon size={18} />
            <div className="error-content">
              <strong>Execution Error:</strong> {error}
              <p className="error-help">Check that the FastAPI server is running at <span className="code-tag">http://localhost:8000</span>.</p>
            </div>
          </div>
        )}
      </div>

      {/* Results & Tool Execution Inspector */}
      {lastResult && (
        <div className="assistant-results-section">
          {/* Transparent Simulation Notice */}
          <div className="transparency-notice">
            <div className="transparency-header">
              <span className="pill pill-success">Agent Workflow Succeeded</span>
              <span className="mode-tag">Simulated Alexa+ Workflow • Zero Paid APIs</span>
            </div>
            <p className="summary-text">{lastResult.summary}</p>

            {/* Assumptions List if available */}
            {lastResult.assumptions && lastResult.assumptions.length > 0 && (
              <div className="assumptions-box">
                <strong>Assumptions & Inferences Made:</strong>
                <ul>
                  {lastResult.assumptions.map((assump, i) => (
                    <li key={i}>{assump}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Tool Execution Step Timeline */}
          {lastResult.execution_steps && lastResult.execution_steps.length > 0 && (
            <div className="card execution-trace-card">
              <div className="card-header">
                <h3>Step-by-Step Tool Execution Trace</h3>
                <span className="badge badge-neutral">{lastResult.execution_steps.length} Steps Executed</span>
              </div>
              <div className="card-body">
                <div className="execution-steps-list">
                  {lastResult.execution_steps.map((step, idx) => (
                    <div key={idx} className="step-item">
                      <div className="step-indicator">
                        <span className={`step-circle ${step.status}`}>
                          {step.status === 'success' ? <CheckIcon size={14} /> : <AlertTriangleIcon size={14} />}
                        </span>
                        {idx < lastResult.execution_steps.length - 1 && <span className="step-connector"></span>}
                      </div>
                      <div className="step-content">
                        <div className="step-top">
                          <span className="step-name">{step.step}</span>
                          <span className="step-tool-badge">{step.tool}</span>
                          <span className={`step-type-badge ${step.type}`}>
                            {step.type === 'real_database_write'
                              ? 'Real SQLite Write'
                              : step.type === 'real_database_read'
                              ? 'Real SQLite Query'
                              : 'Deterministic Simulation Tool'}
                          </span>
                        </div>
                        <p className="step-details">{step.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Output Preview Cards */}
          <div className="assistant-output-grid">
            {/* Generated Tasks */}
            {lastResult.tasks && lastResult.tasks.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title-group">
                    <CheckIcon size={18} className="text-primary" />
                    <h4>Tasks Extracted ({lastResult.tasks.length})</h4>
                  </div>
                  <button className="btn-link" onClick={() => onNavigate('tasks')}>
                    Open My Tasks &rarr;
                  </button>
                </div>
                <div className="card-body">
                  <div className="task-list">
                    {lastResult.tasks.map((t, idx) => (
                      <div key={idx} className="task-row compact">
                        <span className="task-bullet">•</span>
                        <div className="task-info">
                          <span className="task-title">{t.title}</span>
                          <div className="task-meta">
                            <span className={`badge ${t.priority === 'High' ? 'badge-priority-high' : 'badge-neutral'}`}>
                              {t.priority}
                            </span>
                            <span className="meta-deadline">⏰ {t.deadline}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Generated Schedule */}
            {lastResult.schedule && lastResult.schedule.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title-group">
                    <CalendarIcon size={18} className="text-primary" />
                    <h4>Schedule Suggested ({lastResult.schedule.length})</h4>
                  </div>
                  <button className="btn-link" onClick={() => onNavigate('schedule')}>
                    View Schedule &rarr;
                  </button>
                </div>
                <div className="card-body">
                  <div className="timeline-preview">
                    {lastResult.schedule.map((item, idx) => (
                      <div key={idx} className="timeline-row compact">
                        <span className="timeline-slot-time">{item.time}</span>
                        <span className="timeline-slot-activity">{item.activity}</span>
                        {item.is_fixed && <span className="badge badge-fixed">Fixed</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Generated Study Routine */}
            {lastResult.study && lastResult.study.length > 0 && (
              <div className="card full-width">
                <div className="card-header">
                  <div className="card-title-group">
                    <BookOpenIcon size={18} className="text-primary" />
                    <h4>Generated Study Routine (Pomodoro Blocks)</h4>
                  </div>
                  <button className="btn-link" onClick={() => onNavigate('study')}>
                    Launch Study Timer &rarr;
                  </button>
                </div>
                <div className="card-body">
                  <div className="study-blocks-grid">
                    {lastResult.study.map((s, idx) => (
                      <div key={idx} className="study-block-card">
                        <div className="study-block-time">
                          <ClockIcon size={14} />
                          <strong>{s.minutes} min</strong>
                        </div>
                        <p className="study-block-activity">{s.activity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
