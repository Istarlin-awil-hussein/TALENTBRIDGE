import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AppRoute, UserProfile } from '../types';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  user: UserProfile | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  user,
  onLogout,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { route: AppRoute; label: string }[] = [
    { route: 'home', label: 'Home' },
    { route: 'about', label: 'About' },
    { route: 'opportunities', label: 'Find Opportunities' },
    { route: 'credentials', label: 'Skills & Credentials' },
    { route: 'mentorship', label: 'Mentorship' },
    { route: 'resources', label: 'Resources' },
  ];

  const handleNav = (route: AppRoute) => {
    setMobileOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean text wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 rounded"
        >
          SkillBridge
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = currentRoute === item.route;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleNav(item.route)}
                className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                  active
                    ? 'text-blue-800 border-teal-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Account / Primary Actions */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => handleNav(user.role === 'admin' ? 'admin' : 'dashboard')}
                className="px-4 py-2 text-sm font-medium text-slate-800 hover:text-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                {user.role === 'admin' ? 'Admin Console' : 'Dashboard'}
              </button>
              <button
                type="button"
                onClick={() => handleNav('assistant')}
                className="px-4 py-2 text-sm font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                AI Career Assistant
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNav('login')}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleNav('register')}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Register
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="lg:hidden p-2.5 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => handleNav(item.route)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentRoute === item.route
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleNav('readiness')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentRoute === 'readiness'
                ? 'bg-blue-50 text-blue-900'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Work & Financial Readiness
          </button>
          <button
            type="button"
            onClick={() => handleNav('assistant')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentRoute === 'assistant'
                ? 'bg-blue-50 text-blue-900'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            AI Career Assistant
          </button>
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => handleNav(user.role === 'admin' ? 'admin' : 'dashboard')}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-800 rounded-lg"
                >
                  {user.role === 'admin' ? 'Admin Console' : 'My Dashboard'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-4 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className="py-2.5 px-4 text-sm font-medium text-slate-800 border border-slate-300 rounded-lg"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('register')}
                  className="py-2.5 px-4 text-sm font-semibold text-white bg-blue-800 rounded-lg"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clean Workspace Sub-navigation for secondary tools */}
      <div className="hidden lg:block bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => handleNav('readiness')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentRoute === 'readiness' ? 'font-semibold text-teal-800' : ''
              }`}
            >
              Work & Financial Readiness
            </button>
            <button
              type="button"
              onClick={() => handleNav('assistant')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentRoute === 'assistant' ? 'font-semibold text-teal-800' : ''
              }`}
            >
              AI Career Assistant
            </button>
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentRoute === 'admin' ? 'font-semibold text-teal-800' : ''
              }`}
            >
              Admin Portal
            </button>
          </div>
          <span className="text-slate-500 whitespace-nowrap shrink-0">
            Your Skills. Your Future. Your Opportunity.
          </span>
        </div>
      </div>
    </header>
  );
};
