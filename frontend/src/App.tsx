import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AuthForms } from './components/AuthForms';
import SubmitLab from './pages/SubmitLab';
import Dashboard from './pages/Dashboard';
import VivaPrep from './pages/VivaPrep';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import { FileText, PlusCircle, HelpCircle, User, LogOut, Key, Moon, Sun } from 'lucide-react';

function Sidebar({ isDarkMode, toggleDarkMode }: { isDarkMode: boolean, toggleDarkMode: () => void }) {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FileText },
    { name: 'Create PDF', path: '/create', icon: PlusCircle },
    { name: 'Viva Prep', path: '/viva', icon: HelpCircle },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Change Password', path: '/change-password', icon: Key },
  ];

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">LabPilotAI</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <Icon className={`${isActive ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'} mr-3 flex-shrink-0 h-6 w-6`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex flex-col border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <button
          onClick={toggleDarkMode}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
        >
          {isDarkMode ? <Sun className="mr-3 h-6 w-6 text-yellow-500" /> : <Moon className="mr-3 h-6 w-6 text-gray-400" />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={logout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/50"
        >
          <LogOut className="mr-3 h-6 w-6 text-red-500 dark:text-red-400" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { token } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  if (!token) {
    return <AuthForms />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-800 overflow-hidden">
        <Sidebar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<SubmitLab />} />
            <Route path="/viva" element={<VivaPrep />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/change-password" element={<ChangePassword />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
