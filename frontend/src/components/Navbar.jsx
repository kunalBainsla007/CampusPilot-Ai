import React from 'react';
import { SparklesIcon, SunIcon, MoonIcon, MenuIcon, XIcon } from './Icons';

export default function Navbar({
  theme,
  toggleTheme,
  mobileMenuOpen,
  setMobileMenuOpen,
  backendStatus,
}) {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <button
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
        </button>

        <div className="brand-logo">
          <SparklesIcon size={22} className="brand-icon" />
        </div>
        <div className="brand-titles">
          <h1>CampusPilot <span>AI</span></h1>
          <span className="brand-tagline">Alexa+ Inspired Agentic Assistant</span>
        </div>
      </div>

      <div className="navbar-actions">
        <div className={`status-badge ${backendStatus.online ? 'online' : 'offline'}`} title={backendStatus.message}>
          <span className="status-dot"></span>
          <span className="status-text">{backendStatus.online ? 'Backend Connected' : 'Offline Mode'}</span>
        </div>

        <div className="sim-badge" title="This application runs a transparent local rule-based simulation and does not connect to live Amazon services.">
          <span>Alexa+ Track • Simulated</span>
        </div>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>
    </header>
  );
}
