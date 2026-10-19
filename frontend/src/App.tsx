import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { api } from './api/client';
import { AuthForms } from './components/AuthForms';
import LandingPage from './pages/LandingPage';
import SubmitLab from './pages/SubmitLab';
import Dashboard from './pages/Dashboard';
import VivaPrep from './pages/VivaPrep';
import MCQTestPage from './pages/MCQTest';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import {
  LayoutDashboard,
  FilePlus2,
  HelpCircle,
  ClipboardCheck,
  User,
  KeyRound,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { LabPilotLogo } from './components/LabPilotLogo';

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Create PDF', path: '/create', icon: FilePlus2 },
    { name: 'Viva Prep', path: '/viva', icon: HelpCircle },
    { name: 'MCQ Test', path: '/mcq', icon: ClipboardCheck },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Change Password', path: '/change-password', icon: KeyRound },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200 dark:border-gray-800">
        <Link
          to="/"
          className="flex items-center space-x-3 hover:opacity-85 transition-opacity"
          title="View Landing Page & Guide"
        >
          <LabPilotLogo size="md" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">LabPilotAI</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-blue-600 dark:text-blue-400">Lab Suite</span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (onClose) onClose();
                }}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700/80 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Link to Landing / Overview */}
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800/80">
          <Link
            to="/"
            onClick={() => {
              if (onClose) onClose();
            }}
            className="group flex items-center px-3 py-2 text-xs font-medium rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            <Compass className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <span>Product Guide & Home</span>
          </Link>
        </div>
      </div>

      {/* Footer Controls: Theme Toggle & Logout */}
      <div className="flex-shrink-0 flex flex-col border-t border-gray-200 dark:border-gray-800 p-4 space-y-2">
        <button
          id="theme-toggle-btn"
          type="button"
          onClick={toggleDarkMode}
          className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-750 transition-all border border-gray-200 dark:border-gray-700/60"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <div className="flex items-center space-x-2.5">
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-gray-500" />
            )}
            <span>{isDarkMode ? 'Dark Theme' : 'Light Theme'}</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            {isDarkMode ? 'ON' : 'OFF'}
          </span>
        </button>

        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full flex-shrink-0 transition-colors duration-150">
        {sidebarContent}
      </aside>

      {/* Mobile drawer with backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col h-full transition-colors duration-150">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="flex h-full w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-150">
      <Sidebar isMobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Mobile top-bar header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 flex-shrink-0 transition-colors">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/dashboard" className="flex items-center space-x-2.5">
              <LabPilotLogo size="sm" />
              <span className="font-bold text-sm text-gray-900 dark:text-white tracking-tight">LabPilotAI</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto h-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 md:p-8 transition-colors duration-150">
          {children}
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { token } = useAuth();
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      // Prefetch profile immediately in background
      api.getMe().catch(() => {});
    }
  }, [token]);

  return (
    <>
      <Routes>
        {/* Public Landing Page */}
        <Route
          path="/"
          element={
            <LandingPage
              onOpenAuth={(mode) => setAuthModal(mode)}
              onNavigateToDashboard={() => navigate('/dashboard')}
            />
          }
        />

        {/* Dedicated Auth Routes */}
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <AuthForms initialMode="login" />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" replace /> : <AuthForms initialMode="register" />}
        />
        <Route path="/reset-password" element={<AuthForms />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            token ? (
              <DashboardShell>
                <Dashboard />
              </DashboardShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/create"
          element={
            token ? (
              <DashboardShell>
                <SubmitLab />
              </DashboardShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/viva"
          element={
            token ? (
              <DashboardShell>
                <VivaPrep />
              </DashboardShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/mcq"
          element={
            token ? (
              <DashboardShell>
                <MCQTestPage />
              </DashboardShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            token ? (
              <DashboardShell>
                <Profile />
              </DashboardShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/change-password"
          element={
            token ? (
              <DashboardShell>
                <ChangePassword />
              </DashboardShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Auth Modal when triggered from Landing Page */}
      {authModal && !token && (
        <AuthForms
          initialMode={authModal}
          isModal={true}
          onClose={() => setAuthModal(null)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
