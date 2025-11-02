import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Map, 
  Camera, 
  BarChart3, 
  User, 
  Menu, 
  X,
  Sun,
  Moon,
  Trophy
} from 'lucide-react';
import NivaranIcon from './NivaranIcon';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/map', label: 'Issues Map', icon: Map },
    { path: '/report', label: 'Report Issue', icon: Camera },
    { path: '/dashboard', label: 'My Dashboard', icon: BarChart3 },
    { path: '/rewards', label: 'Rewards', icon: Trophy },
  ];

  // Add admin dashboard if user is admin
  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin Panel', icon: BarChart3 });
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, you'd persist this preference
  };

  return (
    <nav className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <NivaranIcon size="xxl" className="flex-shrink-0" />
            <div>
              <h1 className="text-white font-bold text-lg">Nivaran</h1>
              <p className="text-dark-400 text-xs">Issue Resolution Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary-600 text-white'
                      : 'text-dark-300 hover:text-white hover:bg-dark-700'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {isAuthenticated && <NotificationDropdown />}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-dark-300 hover:text-white transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 text-dark-300 hover:text-white transition-colors"
                >
                  <User size={20} />
                  <span className="hidden sm:block">{user?.name}</span>
                </button>

                {/* Profile dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-dark-700">
                        <p className="text-white font-medium">{user?.name}</p>
                        <p className="text-dark-400 text-sm">Citizen</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        My Reports
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-dark-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-dark-300 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-dark-700 py-4">
            {/* Mobile Logo */}
            <div className="flex items-center space-x-3 px-3 py-2 mb-4">
              <NivaranIcon size="medium" className="flex-shrink-0" />
              <div>
                <h1 className="text-white font-bold text-lg">Nivaran</h1>
                <p className="text-dark-400 text-xs">Issue Resolution Platform</p>
              </div>
            </div>
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'bg-primary-600 text-white'
                        : 'text-dark-300 hover:text-white hover:bg-dark-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
