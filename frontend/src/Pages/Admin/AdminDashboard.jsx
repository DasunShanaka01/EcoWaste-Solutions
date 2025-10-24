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
  const [wasteData, setWasteData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch waste data from backend
  const fetchWasteData = async () => {
    setLoading(true);
    try {
  const response = await fetch('http://localhost:8081/api/waste/wastes', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setWasteData(data);
        
        // Calculate stats from real data
        const pending = data.filter(waste => waste.status === 'Pending').length;
        
        setStats({
          totalUsers: 156, // This would need a separate API call
          totalWasteItems: data.length,
          totalCollectors: 12, // This would need a separate API call
          pendingPickups: pending
        });
      } else {
        console.error('Failed to fetch waste data');
      }
    } catch (error) {
      console.error('Error fetching waste data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    
    // Load dashboard stats and waste data
    fetchWasteData();
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
  // Function to generate map URL with markers
  const generateMapUrl = () => {
    if (wasteData.length === 0) {
      return "https://www.google.com/maps/embed/v1/place?key=AIzaSyBuKrghtMt7e6xdr3TLiGhVZNuqTFTgMXk&q=Colombo,Sri+Lanka&zoom=11&maptype=roadmap";
    }
    
    // For now, we'll use a static map. In a real implementation, you'd use Google Maps JavaScript API
    // to create interactive markers for each location
    return "https://www.google.com/maps/embed/v1/place?key=AIzaSyBuKrghtMt7e6xdr3TLiGhVZNuqTFTgMXk&q=Colombo,Sri+Lanka&zoom=11&maptype=roadmap";
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
        {/* Waste Collections Tab */}
        {activeTab === 'waste-collections' && (
          <div className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Collections</dt>
                        <dd className="text-lg font-medium text-gray-900">24</dd>
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
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                        <dd className="text-lg font-medium text-gray-900">18</dd>
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
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                        <dd className="text-lg font-medium text-gray-900">4</dd>
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
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                        <dd className="text-lg font-medium text-gray-900">2</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map View Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Waste Collection Locations Map</h3>
                  <div className="flex space-x-3">
                    <button 
                      onClick={fetchWasteData}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition duration-200"
                    >
                      {loading ? 'Refreshing...' : 'Refresh Map'}
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
                      Filter by Status
                    </button>
                  </div>
                </div>
                
                {/* Map Container */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="relative">
                    {loading ? (
                      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading waste collection data...</p>
                        </div>
                      </div>
                    ) : wasteData.length > 0 ? (
                      <div className="space-y-4">
                        {/* Map with markers */}
                        <div className="relative">
                          <iframe
                            src={generateMapUrl()}
                            width="100%"
                            height="400"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="rounded-lg"
                            title="Waste Collection Locations Map"
                          />
                          <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span>Completed</span>
                              <div className="w-3 h-3 bg-yellow-500 rounded-full ml-2"></div>
                              <span>Pending</span>
                              <div className="w-3 h-3 bg-red-500 rounded-full ml-2"></div>
                              <span>Failed</span>
                            </div>
                          </div>
                          <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-600">
                            📍 {wasteData.length} Collections
                          </div>
                        </div>
                        
                        {/* Location List */}
                        <div className="bg-white rounded-lg p-4">
                          <h4 className="font-semibold mb-3">Collection Locations ({wasteData.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                            {wasteData.map((waste, index) => (
                              <div key={waste.id || index} className="border border-gray-200 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-900">{waste.fullName}</p>
                                    <p className="text-xs text-gray-600">{waste.email}</p>
                                  </div>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    waste.status === 'Completed' || waste.status === 'Processed' 
                                      ? 'bg-green-100 text-green-800'
                                      : waste.status === 'Pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {waste.status}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <p><strong>Location:</strong> {waste.location ? 
                                    `${waste.location.latitude.toFixed(4)}, ${waste.location.longitude.toFixed(4)}` : 
                                    'No GPS data'
                                  }</p>
                                  <p><strong>Weight:</strong> {waste.totalWeightKg} kg</p>
                                  <p><strong>Category:</strong> {waste.items && waste.items[0] ? waste.items[0].category : 'N/A'}</p>
                                  <p><strong>Method:</strong> {waste.submissionMethod}</p>
                                  {waste.pickup && waste.pickup.address && (
                                    <p><strong>Address:</strong> {waste.pickup.address}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                        <div className="text-center">
                          <div className="text-gray-400 text-4xl mb-4">🗑️</div>
                          <p className="text-gray-600">No waste collection data available</p>
                          <button 
                            onClick={fetchWasteData}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Refresh Data
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Map showing all waste collection locations submitted by users. Real-time data from database.
                  </p>
                </div>
              </div>
            </div>

            {/* Collections Management Table */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Waste Collections Management</h3>
                  <div className="flex space-x-3">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200">
                      Export Data
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
                      Generate Report
                    </button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading waste data...</p>
                    </div>
                  </div>
                ) : wasteData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {wasteData.map((waste, index) => (
                          <tr key={waste.id || index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{waste.id ? waste.id.toString().slice(-6) : index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{waste.fullName}</div>
                                <div className="text-xs text-gray-500">{waste.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                {waste.location ? (
                                  <div>
                                    <div className="font-medium">
                                      {waste.location.latitude.toFixed(4)}, {waste.location.longitude.toFixed(4)}
                                    </div>
                                    {waste.pickup && waste.pickup.address && (
                                      <div className="text-xs text-gray-500">{waste.pickup.address}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-gray-400">No GPS data</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {waste.totalWeightKg} kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {waste.items && waste.items[0] ? waste.items[0].category : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                waste.status === 'Completed' || waste.status === 'Processed' 
                                  ? 'bg-green-100 text-green-800'
                                  : waste.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {waste.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {waste.submissionDate ? new Date(waste.submissionDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                              <button className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">🗑️</div>
                    <p className="text-gray-600 mb-4">No waste collection data available</p>
                    <button 
                      onClick={fetchWasteData}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                    >
                      Refresh Data
                    </button>
                  </div>
                )}
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
