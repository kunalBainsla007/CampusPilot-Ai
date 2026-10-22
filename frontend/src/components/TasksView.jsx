import React, { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  EditIcon,
  SearchIcon,
  FilterIcon,
  CheckSquareIcon,
} from './Icons';
import Modal from './Modal';

export default function TasksView({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTask,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'completed'
  const [filterPriority, setFilterPriority] = useState('all'); // 'all', 'High', 'Normal', 'Low'
  const [sortBy, setSortBy] = useState('urgency'); // 'urgency', 'deadline', 'title'

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    priority: 'Normal',
    deadline: 'Tonight',
    estimated_minutes: 30,
    subject: '',
  });

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      priority: 'Normal',
      deadline: 'Tonight',
      estimated_minutes: 30,
      subject: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setActiveTask(task);
    setFormData({
      title: task.title,
      priority: task.priority || 'Normal',
      deadline: task.deadline || 'Not specified',
      estimated_minutes: task.estimated_minutes || 30,
      subject: task.subject || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (task) => {
    setActiveTask(task);
    setIsDeleteModalOpen(true);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onAddTask(formData);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!activeTask || !formData.title.trim()) return;
    onEditTask(activeTask.id, formData);
    setIsEditModalOpen(false);
    setActiveTask(null);
  };

  const handleConfirmDelete = () => {
    if (!activeTask) return;
    onDeleteTask(activeTask.id);
    setIsDeleteModalOpen(false);
    setActiveTask(null);
  };

  // Filter & Search Logic
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.deadline && t.deadline.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === 'all' ? true : filterStatus === 'pending' ? !t.done : t.done;

    const matchesPriority =
      filterPriority === 'all' ? true : t.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort Logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'urgency') {
      const pScore = { High: 1, Normal: 2, Low: 3 };
      return (pScore[a.priority] || 2) - (pScore[b.priority] || 2);
    }
    if (sortBy === 'deadline') {
      return (a.deadline || '').localeCompare(b.deadline || '');
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const pendingCount = tasks.filter((t) => !t.done).length;
  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <div className="view-container">
      {/* Top Header Bar */}
      <div className="section-header-bar">
        <div>
          <h2>My Task Checklist</h2>
          <p className="subtitle">
            Manage your academic workload, track deadlines, and sync updates automatically with local storage.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <PlusIcon size={16} /> Add New Task
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="tasks-control-panel">
        <div className="search-bar">
          <SearchIcon size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks by name, subject, or deadline…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tasks"
          />
        </div>

        <div className="filters-group">
          <div className="filter-item">
            <span className="filter-label">Status:</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All ({tasks.length})</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="completed">Completed ({completedCount})</option>
            </select>
          </div>

          <div className="filter-item">
            <span className="filter-label">Priority:</span>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="filter-item">
            <span className="filter-label">Sort:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="urgency">Urgency (High First)</option>
              <option value="deadline">Deadline</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table / List */}
      <div className="card">
        <div className="card-body no-padding">
          {sortedTasks.length === 0 ? (
            <div className="empty-state large">
              <CheckSquareIcon size={40} className="text-muted" />
              <h3>No tasks found</h3>
              <p>
                {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'Try clearing your search filters to view your tasks.'
                  : 'Your task list is empty. Ask the assistant to plan your day or add a task manually!'}
              </p>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                <PlusIcon size={14} /> Add First Task
              </button>
            </div>
          ) : (
            <div className="tasks-table">
              <div className="tasks-table-header">
                <span className="col-status">Done</span>
                <span className="col-title">Task Title</span>
                <span className="col-priority">Priority</span>
                <span className="col-deadline">Deadline</span>
                <span className="col-duration">Est. Time</span>
                <span className="col-actions">Actions</span>
              </div>
              <div className="tasks-table-body">
                {sortedTasks.map((task) => (
                  <div key={task.id} className={`tasks-table-row ${task.done ? 'row-done' : ''}`}>
                    <div className="col-status">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => onToggleTask(task.id)}
                          aria-label={`Mark ${task.title} as ${task.done ? 'pending' : 'completed'}`}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </div>

                    <div className="col-title">
                      <span className={`task-text ${task.done ? 'strikethrough' : ''}`}>
                        {task.title}
                      </span>
                      {task.subject && <span className="subject-pill">{task.subject}</span>}
                    </div>

                    <div className="col-priority">
                      <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="col-deadline">
                      <span className="deadline-text">⏰ {task.deadline}</span>
                    </div>

                    <div className="col-duration">
                      <span className="duration-text">{task.estimated_minutes || 30} min</span>
                    </div>

                    <div className="col-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleOpenEdit(task)}
                        title="Edit task"
                        aria-label={`Edit ${task.title}`}
                      >
                        <EditIcon size={15} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleOpenDelete(task)}
                        title="Delete task"
                        aria-label={`Delete ${task.title}`}
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Task">
        <form onSubmit={handleSaveAdd} className="modal-form">
          <div className="form-group">
            <label htmlFor="task-title">Task Title *</label>
            <input
              id="task-title"
              type="text"
              placeholder="e.g. Finish Machine Learning problem set"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="High">High Priority</option>
                <option value="Normal">Normal Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-deadline">Deadline</label>
              <input
                id="task-deadline"
                type="text"
                placeholder="e.g. Tonight, Tomorrow, 18:00"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-subject">Subject / Course</label>
              <input
                id="task-subject"
                type="text"
                placeholder="e.g. Computer Science, Math"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-minutes">Estimated Duration (min)</label>
              <input
                id="task-minutes"
                type="number"
                min="10"
                max="300"
                step="5"
                value={formData.estimated_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!formData.title.trim()}>
              Save Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Task Details">
        <form onSubmit={handleSaveEdit} className="modal-form">
          <div className="form-group">
            <label htmlFor="edit-task-title">Task Title *</label>
            <input
              id="edit-task-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-task-priority">Priority</label>
              <select
                id="edit-task-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-task-deadline">Deadline</label>
              <input
                id="edit-task-deadline"
                type="text"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-task-subject">Subject</label>
              <input
                id="edit-task-subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-task-minutes">Estimated Duration (min)</label>
              <input
                id="edit-task-minutes"
                type="number"
                min="10"
                max="300"
                step="5"
                value={formData.estimated_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!formData.title.trim()}>
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="delete-confirm-body">
          <p>
            Are you sure you want to permanently delete task:
          </p>
          <div className="delete-target-preview">
            <strong>"{activeTask?.title}"</strong>
          </div>
          <p className="text-muted">This action will remove it from SQLite and localStorage.</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
              Delete Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
