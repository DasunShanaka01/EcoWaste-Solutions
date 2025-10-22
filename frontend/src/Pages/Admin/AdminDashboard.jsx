import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../Users/UserContext";
import Report from "./Report";
import User_details from "./User_details";

export default function AdminDashboard() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Real-time dashboard data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWasteItems: 0,
    totalCollectors: 0,
    pendingPickups: 0
  });

  const [wasteCategories, setWasteCategories] = useState({ 
    chartData: [], 
    totalCategories: 0 
  });

  const [specialCollections, setSpecialCollections] = useState({ 
    chartData: [], 
    totalCollections: 0 
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [collectionRoutes, setCollectionRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard statistics
      const statsResponse = await fetch('http://localhost:8080/api/admin/dashboard-stats', {
        method: 'GET',
        credentials: 'include'
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch waste categories for pie chart
      const categoriesResponse = await fetch('http://localhost:8080/api/admin/waste-categories', {
        method: 'GET',
        credentials: 'include'
      });
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setWasteCategories(categoriesData);
      }

      // Fetch special collections for bar chart
      const specialResponse = await fetch('http://localhost:8080/api/admin/special-collections', {
        method: 'GET',
        credentials: 'include'
      });
      if (specialResponse.ok) {
        const specialData = await specialResponse.json();
        setSpecialCollections(specialData);
      }

      // Fetch recent activities
      const activitiesResponse = await fetch('http://localhost:8080/api/admin/recent-activities', {
        method: 'GET',
        credentials: 'include'
      });
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setRecentActivities(activitiesData);
      }

      // Fetch collection routes
      const routesResponse = await fetch('http://localhost:8080/api/admin/collection-routes', {
        method: 'GET',
        credentials: 'include'
      });
      if (routesResponse.ok) {
        const routesData = await routesResponse.json();
        setCollectionRoutes(routesData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      navigate("/users/login");
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const handleLogout = () => {
    setUser(null);
    navigate("/users/login");
  };

  // Render Pie Chart for Waste Categories
  const renderWasteCategoriesPieChart = () => {
    if (!wasteCategories.chartData || wasteCategories.chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          No waste category data available
        </div>
      );
    }

    const total = wasteCategories.chartData.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 42 42" className="w-48 h-48 transform -rotate-90">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e5e7eb" strokeWidth="1"/>
            {wasteCategories.chartData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 hover:stroke-width-4"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-500">Total Items</div>
            </div>
          </div>
        </div>
        <div className="ml-6">
          {wasteCategories.chartData.map((item, index) => (
            <div key={index} className="flex items-center mb-2">
              <div 
                className="w-4 h-4 rounded-full mr-2" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-700">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Bar Chart for Special Collections
  const renderSpecialCollectionsBarChart = () => {
    if (!specialCollections.chartData || specialCollections.chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          No special collections data available
        </div>
      );
    }

    const maxValue = Math.max(...specialCollections.chartData.map(item => item.value));

    return (
      <div className="space-y-3">
        {specialCollections.chartData.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-20 text-sm text-gray-600 mr-3">{item.category}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
              <div
                className="h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium transition-all duration-500"
                style={{
                  backgroundColor: item.color,
                  width: `${(item.value / maxValue) * 100}%`,
                  minWidth: '30px'
                }}
              >
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <div className="hidden md:flex space-x-6">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                    activeTab === 'users'
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('report-analytics')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                    activeTab === 'report-analytics'
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  Report Analytics
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-blue-100 text-sm">Welcome, {user?.name || 'Admin'}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && (
          <div>
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Real-time Dashboard</h2>
              <button
                onClick={fetchDashboardData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">👥</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">🗑️</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Waste Items</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalWasteItems}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">🚛</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Collectors</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalCollectors}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">⏰</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Pickups</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.pendingPickups}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Waste Categories Pie Chart */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Waste Categories Distribution
                  </h3>
                  {renderWasteCategoriesPieChart()}
                </div>
              </div>

              {/* Special Collections Bar Chart */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Special Collections Status
                  </h3>
                  {renderSpecialCollectionsBarChart()}
                </div>
              </div>
            </div>

            {/* Collection Routes Section */}
            <div className="mb-8 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Collection Routes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collectionRoutes.map((route) => (
                    <div key={route.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{route.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          route.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {route.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">City: {route.city}</p>
                      <p className="text-sm text-gray-600 mb-1">Collection Points: {route.collectionPoints}</p>
                      <p className="text-sm text-gray-600">Estimated Time: {route.estimatedTime}</p>
                    </div>
                  ))}
                </div>
                {collectionRoutes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No collection routes available. Routes will be generated based on waste pickup locations.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                      <li key={index}>
                        <div className={`relative ${index !== recentActivities.length - 1 ? 'pb-8' : ''}`}>
                          {index !== recentActivities.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                activity.type === 'waste' ? 'bg-green-500' : 
                                activity.type === 'special' ? 'bg-blue-500' : 'bg-yellow-500'
                              }`}>
                                <span className="text-white text-xs">
                                  {activity.type === 'waste' ? '✓' : activity.type === 'special' ? '★' : '●'}
                                </span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">{activity.message}</p>
                                <p className="text-xs text-gray-400">Status: {activity.status}</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time>{activity.time}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    )) : (
                      <li className="text-center py-8 text-gray-500">
                        No recent activities. Start by adding waste items or scheduling collections.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <User_details />}
        {activeTab === 'report-analytics' && <Report />}
      </main>
    </div>
  );
}
