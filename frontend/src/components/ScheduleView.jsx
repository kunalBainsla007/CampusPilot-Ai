import React, { useState } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  AlertTriangleIcon,
  PlusIcon,
  TrashIcon,
} from './Icons';
import Modal from './Modal';

export default function ScheduleView({
  schedule,
  onAddScheduleEvent,
  onDeleteScheduleEvent,
  onNavigate,
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    time: '14:00',
    end_time: '15:00',
    activity: '',
    is_fixed: false,
    duration_minutes: 60,
  });

  const conflicts = schedule.filter((s) => s.has_conflict);

  const handleOpenAdd = () => {
    setFormData({
      time: '14:00',
      end_time: '15:00',
      activity: '',
      is_fixed: false,
      duration_minutes: 60,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!formData.activity.trim() || !formData.time.trim()) return;
    onAddScheduleEvent(formData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="view-container">
      {/* Header Bar */}
      <div className="section-header-bar">
        <div>
          <h2>Daily Schedule Timeline</h2>
          <p className="subtitle">
            Deterministic, conflict-aware daily schedule. Fixed commitments are preserved; flexible activities are scheduled around them.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate('assistant')}>
            Regenerate with AI
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <PlusIcon size={16} /> Add Custom Event
          </button>
        </div>
      </div>

      {/* Conflict Alert Banner if any conflicts exist */}
      {conflicts.length > 0 && (
        <div className="alert-banner warning">
          <AlertTriangleIcon size={24} className="alert-icon" />
          <div className="alert-text">
            <strong>Schedule Overlap Detected ({conflicts.length} Events)</strong>
            <p>
              Two or more activities have overlapping time intervals. Check the conflict tags below.
            </p>
          </div>
        </div>
      )}

      {/* Timeline Card */}
      <div className="card">
        <div className="card-body">
          {schedule.length === 0 ? (
            <div className="empty-state large">
              <CalendarIcon size={44} className="text-muted" />
              <h3>No scheduled activities yet</h3>
              <p>
                Use the AI Assistant to automatically build an optimal daily schedule from your tasks and classes.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('assistant')}>
                Open Assistant Planner
              </button>
            </div>
          ) : (
            <div className="schedule-timeline">
              {schedule.map((item, index) => (
                <div
                  key={item.id || index}
                  className={`schedule-card ${item.is_fixed ? 'fixed' : 'flexible'} ${
                    item.has_conflict ? 'has-conflict' : ''
                  }`}
                >
                  <div className="schedule-card-time">
                    <span className="time-start">{item.time}</span>
                    {item.end_time && <span className="time-divider">-</span>}
                    {item.end_time && <span className="time-end">{item.end_time}</span>}
                    <div className="time-duration">
                      <ClockIcon size={12} />
                      <span>{item.duration_minutes || 60}m</span>
                    </div>
                  </div>

                  <div className="schedule-card-content">
                    <div className="card-top-row">
                      <h4 className="schedule-activity-title">{item.activity}</h4>
                      <div className="card-badges">
                        {item.is_fixed ? (
                          <span className="badge badge-fixed">Locked Fixed Event</span>
                        ) : (
                          <span className="badge badge-flexible">Suggested Flexible Slot</span>
                        )}
                        {item.has_conflict && (
                          <span className="badge badge-conflict">
                            <AlertTriangleIcon size={12} /> Conflict Overlap
                          </span>
                        )}
                      </div>
                    </div>

                    {item.conflict_details && (
                      <p className="conflict-warning-text">⚠️ {item.conflict_details}</p>
                    )}

                    {!item.is_fixed && (
                      <div className="schedule-card-actions">
                        <button
                          className="btn-icon-subtle text-danger"
                          onClick={() => onDeleteScheduleEvent(item.id)}
                          title="Remove suggested activity"
                          aria-label={`Remove ${item.activity}`}
                        >
                          <TrashIcon size={14} /> Remove Slot
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Schedule Event Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Schedule Activity">
        <form onSubmit={handleSaveAdd} className="modal-form">
          <div className="form-group">
            <label htmlFor="event-activity">Activity Title *</label>
            <input
              id="event-activity"
              type="text"
              placeholder="e.g. Database Lecture, Library Study Session"
              value={formData.activity}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event-start">Start Time (HH:MM or 9 AM) *</label>
              <input
                id="event-start"
                type="text"
                placeholder="09:00"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-end">End Time (optional)</label>
              <input
                id="event-end"
                type="text"
                placeholder="10:00"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event-duration">Duration (Minutes)</label>
              <input
                id="event-duration"
                type="number"
                min="15"
                max="300"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
              />
            </div>

            <div className="form-group checkbox-field">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={formData.is_fixed}
                  onChange={(e) => setFormData({ ...formData, is_fixed: e.target.checked })}
                />
                <span className="checkmark"></span>
                <span>Fixed Commitment (Class/Meeting)</span>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!formData.activity.trim()}>
              Save Event
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
