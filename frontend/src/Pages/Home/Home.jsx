import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../Users/UserContext'
import api from '../../api/auth'

const Home = () => {
  const { user, setUser } = useUser();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    // Ensure we have a full user object (with id) in context
    const ensureUser = async () => {
      if (!user || (!user.id && !user._id)) {
        try {
          const current = await api.getCurrentUser();
          const normalized = current?.user || current; // some APIs wrap inside { user }
          if (normalized) {
            setUser(normalized);
          } else {
            setLoadFailed(true);
          }
        } catch (e) {
          setLoadFailed(true);
        }
      }
    };
    ensureUser();
  }, [user, setUser]);

  const userId = useMemo(() => {
    if (!user) return undefined;
    return user.id || user._id;
  }, [user]);

  // Get role-specific content
  const getRoleContent = () => {
    if (!user) return null;

    switch (user.role) {
      case 'ADMIN':
        return {
          title: "Admin Dashboard",
          subtitle: "Manage your waste management system",
          features: [
            { icon: "📊", title: "Analytics", desc: "View system analytics and reports", link: "/admin/dashboard" },
            { icon: "👥", title: "User Management", desc: "Manage users and permissions", link: "/admin/users" },
            { icon: "🗑️", title: "Collections", desc: "Monitor waste collections", link: "/admin/collections" },
            { icon: "📈", title: "Reports", desc: "Generate detailed reports", link: "/admin/reports" }
          ]
        };
      case 'COLLECTOR':
        return {
          title: "Collector Dashboard",
          subtitle: "Manage your collection routes and tasks",
          features: [
            { icon: "🗺️", title: "Collection Route", desc: "View your assigned routes", link: "/collector/route" },
            { icon: "♻️", title: "Waste Collection", desc: "Process waste collections", link: "/collector/collection" },
            { icon: "📋", title: "History", desc: "View collection history", link: "/collector/history" },
            { icon: "📊", title: "Dashboard", desc: "Overview of your tasks", link: "/collector/dashboard" }
          ]
        };
      case 'USER':
      default:
        return {
          title: "Welcome to EcoWaste",
          subtitle: "Manage your waste disposal efficiently",
          features: [
            { icon: "➕", title: "Add Waste", desc: "Schedule waste collection", link: "/wasteform" },
            { icon: "⭐", title: "Special Collection", desc: "Request special waste pickup", link: "/special/schedule" },
            { icon: "📅", title: "Manage Collections", desc: "View and manage your collections", link: "/special/manage" },
            { icon: "👤", title: "Profile", desc: "Update your profile", link: "/profile" }
          ]
        };
    }
  };

  const roleContent = getRoleContent();

  // Loading state
  if (!userId && !loadFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!userId && loadFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">There was an issue loading your user information. Please try refreshing the page or contact support.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-full p-4 shadow-lg">
                <span className="text-6xl">♻️</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              {roleContent?.title}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {roleContent?.subtitle}
            </p>
            {user && (
              <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-3 shadow-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-800">
                    {user.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">{user.name}</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {user.role}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <p className="text-lg text-gray-600">Access your most important features</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roleContent?.features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Making a Difference</h2>
            <p className="text-lg text-gray-600">Together, we're building a sustainable future</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">1000+</div>
              <div className="text-gray-600">Collections Processed</div>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">♻️</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Tons Recycled</div>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">250+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to make a positive impact?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of users who are already making a difference in waste management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user?.role === 'USER' && (
              <>
                <Link
                  to="/wasteform"
                  className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Schedule Collection
                </Link>
                <Link
                  to="/special/schedule"
                  className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors"
                >
                  Special Collection
                </Link>
              </>
            )}
            {user?.role === 'COLLECTOR' && (
              <Link
                to="/collector/dashboard"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View Dashboard
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-2xl">♻️</span>
              <span className="text-2xl font-bold">EcoWaste</span>
            </div>
            <p className="text-gray-400 mb-4">
              Sustainable waste management for a better tomorrow
            </p>
            <div className="text-sm text-gray-500">
              © 2024 EcoWaste. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;