import React from 'react';
import {
  LayoutDashboardIcon,
  SparklesIcon,
  CheckSquareIcon,
  CalendarIcon,
  BookOpenIcon,
  AlertTriangleIcon,
} from './Icons';

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  taskCount,
  pendingCount,
  conflictCount,
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
    { id: 'assistant', label: 'AI Assistant', icon: SparklesIcon, highlight: true },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquareIcon, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'schedule', label: 'Schedule', icon: CalendarIcon, warningBadge: conflictCount > 0 ? conflictCount : null },
    { id: 'study', label: 'Study Planner', icon: BookOpenIcon },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
      <div className="sidebar-nav">
        <div className="nav-group-title">WORKSPACE</div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'nav-highlight' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="nav-icon"><IconComponent size={19} /></span>
                <span className="nav-label">{item.label}</span>
                {item.badge !== undefined && item.badge !== null && (
                  <span className="nav-badge" title={`${item.badge} pending tasks`}>{item.badge}</span>
                )}
                {item.warningBadge !== undefined && item.warningBadge !== null && (
                  <span className="nav-warning-badge" title={`${item.warningBadge} schedule conflict`}>
                    <AlertTriangleIcon size={12} /> {item.warningBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-card">
          <div className="sidebar-card-header">
            <span className="pulse-dot"></span>
            <strong>Local Agent Engine</strong>
          </div>
          <p>Deterministic tool planner active with SQLite persistence.</p>
        </div>
      </div>
    </aside>
  );
}
