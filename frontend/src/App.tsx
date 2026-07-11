import { useState } from 'react';
import { useStadiumStore } from './store/stadiumStore';
import { FanAssistant } from './components/Assistant/FanAssistant';
import { StaffDashboard } from './components/Dashboard/StaffDashboard';
import { ZoneMap } from './components/Zones/ZoneMap';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { SkipLink } from './components/shared/SkipLink';

export default function App() {
  const view = useStadiumStore((s) => s.view);
  const setView = useStadiumStore((s) => s.setView);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors duration-300">
        <SkipLink />

        {/* Header navigation bar */}
        <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-2xl font-black tracking-tight text-primary-600 flex items-center gap-2">
                    <span aria-hidden="true">🏟️</span> StadiumSync
                  </span>
                </div>
                <nav className="hidden sm:ml-8 sm:flex sm:space-x-8" aria-label="Main Navigation">
                  <button
                    onClick={() => setView('assistant')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      view === 'assistant'
                        ? 'border-primary-500 text-slate-950 font-semibold'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                    aria-current={view === 'assistant' ? 'page' : undefined}
                  >
                    Fan Assistant
                  </button>
                  <button
                    onClick={() => setView('dashboard')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      view === 'dashboard'
                        ? 'border-primary-500 text-slate-950 font-semibold'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                    aria-current={view === 'dashboard' ? 'page' : undefined}
                  >
                    Staff Dashboard
                  </button>
                  <button
                    onClick={() => setView('zones')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      view === 'zones'
                        ? 'border-primary-500 text-slate-950 font-semibold'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                    aria-current={view === 'zones' ? 'page' : undefined}
                  >
                    Zone Status
                  </button>
                </nav>
              </div>

              {/* Mobile menu button */}
              <div className="-mr-2 flex items-center sm:hidden">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  aria-expanded={menuOpen}
                  aria-controls="mobile-menu"
                >
                  <span className="sr-only">Open main menu</span>
                  <span aria-hidden="true" className="text-xl">
                    {menuOpen ? '✕' : '☰'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu navigation */}
          {menuOpen && (
            <div className="sm:hidden" id="mobile-menu">
              <nav className="pt-2 pb-3 space-y-1" aria-label="Mobile Navigation">
                <button
                  onClick={() => {
                    setView('assistant');
                    setMenuOpen(false);
                  }}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left transition-colors ${
                    view === 'assistant'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700'
                  }`}
                  aria-current={view === 'assistant' ? 'page' : undefined}
                >
                  Fan Assistant
                </button>
                <button
                  onClick={() => {
                    setView('dashboard');
                    setMenuOpen(false);
                  }}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left transition-colors ${
                    view === 'dashboard'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700'
                  }`}
                  aria-current={view === 'dashboard' ? 'page' : undefined}
                >
                  Staff Dashboard
                </button>
                <button
                  onClick={() => {
                    setView('zones');
                    setMenuOpen(false);
                  }}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left transition-colors ${
                    view === 'zones'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700'
                  }`}
                  aria-current={view === 'zones' ? 'page' : undefined}
                >
                  Zone Status
                </button>
              </nav>
            </div>
          )}
        </header>

        {/* Main content body */}
        <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 min-h-[500px]">
            {view === 'assistant' && <FanAssistant />}
            {view === 'dashboard' && <StaffDashboard />}
            {view === 'zones' && <ZoneMap />}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p>&copy; {new Date().getFullYear()} StadiumSync. Built for smart World Cup 2026 stadium operations.</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
