import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../Pages/Users/UserContext';

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await logout();
        navigate("/users/login");
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
  };

  // Role-based navigation items
  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { name: 'Home', path: '/home', icon: '🏠' }
    ];

    switch (user.role) {
      case 'ADMIN':
        return [
          ...baseItems,
          { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
          { name: 'Users', path: '/admin/users', icon: '👥' },
          { name: 'Collections', path: '/admin/collections', icon: '🗑️' },
          { name: 'Reports', path: '/admin/reports', icon: '📈' },
          { name: 'Settings', path: '/admin/settings', icon: '⚙️' }
        ];
      
      case 'COLLECTOR':
        return [
          ...baseItems,
          { name: 'Dashboard', path: '/collector/dashboard', icon: '📊' },
          { name: 'Collection Route', path: '/collector/route', icon: '🗺️' },
          { name: 'Waste Collection', path: '/collector/collection', icon: '♻️' },
          { name: 'History', path: '/collector/history', icon: '📋' },
          { name: 'Profile', path: '/profile', icon: '👤' }
        ];
      
      case 'USER':
      default:
        return [
          ...baseItems,
          { name: 'Add Waste', path: '/wasteform', icon: '➕' },
          { name: 'My Collections', path: '/wastecollection', icon: '🗑️' },
          { name: 'Special Collection', path: '/special/schedule', icon: '⭐' },
          { name: 'Manage Collections', path: '/special/manage', icon: '📅' },
          { name: 'Profile', path: '/profile', icon: '👤' }
        ];
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'ADMIN': return 'bg-red-600';
      case 'COLLECTOR': return 'bg-blue-600';
      case 'USER': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getRoleBadge = () => {
    if (!user) return null;
    
    const roleConfig = {
      'ADMIN': { text: 'Admin', color: 'bg-red-100 text-red-800' },
      'COLLECTOR': { text: 'Collector', color: 'bg-blue-100 text-blue-800' },
      'USER': { text: 'User', color: 'bg-green-100 text-green-800' }
    };

    const config = roleConfig[user.role] || { text: 'User', color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className={`${getRoleColor()} shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-white font-bold text-xl hover:text-gray-200 transition-colors"
            >
              <span className="text-2xl">♻️</span>
              <span>EcoWaste</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-black hover:bg-opacity-20 transition-colors duration-200"
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* User Section */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{user.name}</div>
                  <div className="text-xs text-gray-200">{user.email}</div>
                </div>
                {getRoleBadge()}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-md p-1"
                >
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{user.name?.charAt(0) || 'U'}</span>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <span>👤</span>
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <span>⚙️</span>
                      <span>Settings</span>
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-md p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black bg-opacity-20 rounded-lg mt-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-white hover:bg-black hover:bg-opacity-20 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {user && (
                <>
                  <div className="border-t border-white border-opacity-20 my-2"></div>
                  <div className="px-3 py-2">
                    <div className="text-sm text-white font-medium">{user.name}</div>
                    <div className="text-xs text-gray-200">{user.email}</div>
                    <div className="mt-1">{getRoleBadge()}</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-600 hover:bg-opacity-20 transition-colors duration-200"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isProfileDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileDropdownOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
