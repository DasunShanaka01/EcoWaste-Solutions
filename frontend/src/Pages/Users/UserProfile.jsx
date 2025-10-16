import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/auth";
import { useUser } from "./UserContext";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [wasteSubmissions, setWasteSubmissions] = useState([]);
  const [wasteLoading, setWasteLoading] = useState(false);
  const [editingWaste, setEditingWaste] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editCurrentStep, setEditCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const { user: contextUser, setUser: setContextUser, logout } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (contextUser) {
      setUser(contextUser);
      setFormData({
        name: contextUser.name || "",
        phone: contextUser.phone || "",
        email: contextUser.email || ""
      });
      // Fetch waste submissions when user is loaded
      fetchWasteSubmissions(contextUser.id || contextUser._id);
    }
  }, [contextUser]);

  // Auto-switch to waste tab if there are submissions and user is on profile tab
  useEffect(() => {
    if (wasteSubmissions.length > 0 && activeTab === 'profile') {
      // Optional: You can uncomment this to auto-switch to waste tab
      // setActiveTab('waste');
    }
  }, [wasteSubmissions.length, activeTab]);

  const fetchWasteSubmissions = async (userId) => {
    if (!userId) return;
    
    setWasteLoading(true);
    try {
      const submissions = await api.getUserWasteSubmissions(userId);
      setWasteSubmissions(submissions || []);
    } catch (err) {
      console.error("Error fetching waste submissions:", err);
      setWasteSubmissions([]);
    } finally {
      setWasteLoading(false);
    }
  };

  const handleDeleteWaste = async (wasteId) => {
    if (!window.confirm("Are you sure you want to delete this waste submission? This action cannot be undone.")) {
      return;
    }

    try {
      await api.deleteWasteSubmission(wasteId);
      setSuccess("Waste submission deleted successfully!");
      // Refresh the waste submissions list
      fetchWasteSubmissions(user.id || user._id);
    } catch (err) {
      console.error("Error deleting waste submission:", err);
      setError("Failed to delete waste submission. Please try again.");
    }
  };

  const handleEditWaste = (waste) => {
    setEditingWaste(waste);
    setEditFormData({
      selectedCategory: waste.items?.[0]?.category || '',
      itemDescription: waste.items?.[0]?.itemType || '',
      submissionMethod: waste.submissionMethod,
      totalWeightKg: waste.totalWeightKg,
      totalPaybackAmount: waste.totalPaybackAmount,
      pickup: waste.pickup || {},
      items: waste.items || [],
      address: waste.pickup?.address || '',
      city: waste.pickup?.city || '',
      zipCode: waste.pickup?.zipCode || '',
      pickupDate: waste.pickup?.date || '',
      pickupTimeSlot: waste.pickup?.timeSlot || ''
    });
    setEditCurrentStep(1);
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySelect = (category) => {
    setEditFormData(prev => ({ ...prev, selectedCategory: category }));
  };

  const handleMethodSelect = (method) => {
    setEditFormData(prev => ({ ...prev, submissionMethod: method }));
  };

  const nextEditStep = () => {
    if (editCurrentStep < 5) setEditCurrentStep(editCurrentStep + 1);
  };

  const prevEditStep = () => {
    if (editCurrentStep > 1) setEditCurrentStep(editCurrentStep - 1);
  };

  const handleUpdateWaste = async () => {
    if (!editingWaste) return;

    try {
      // Prepare the update data
      const updateData = {
        submissionMethod: editFormData.submissionMethod,
        totalWeightKg: editFormData.totalWeightKg,
        totalPaybackAmount: calculatePayback(editFormData.totalWeightKg, editFormData.selectedCategory),
        pickup: {
          required: editFormData.submissionMethod === 'Home Pickup',
          date: editFormData.pickupDate || null,
          timeSlot: editFormData.pickupTimeSlot || null,
          address: editFormData.address || '',
          city: editFormData.city || '',
          zipCode: editFormData.zipCode || ''
        },
        items: [{
          category: editFormData.selectedCategory,
          itemType: editFormData.itemDescription || 'N/A',
          quantity: 1,
          estimatedWeightKg: editFormData.totalWeightKg || 0,
          estimatedPayback: calculatePayback(editFormData.totalWeightKg, editFormData.selectedCategory)
        }]
      };

      await api.updateWasteSubmission(editingWaste.id, updateData);
      setSuccess("Waste submission updated successfully!");
      setShowEditModal(false);
      setEditingWaste(null);
      // Refresh the waste submissions list
      fetchWasteSubmissions(user.id || user._id);
    } catch (err) {
      console.error("Error updating waste submission:", err);
      setError("Failed to update waste submission. Please try again.");
    }
  };

  const canEditWaste = (waste) => {
    // Can only edit if status is "Pending" (regardless of submission method)
    return waste.status === 'Pending';
  };

  // Categories for edit form (same as WasteForm)
  const categories = [
    { name: 'E-waste', image: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=300', ratePerKg: 15.00 },
    { name: 'Plastic', image: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=300', ratePerKg: 8.00 },
    { name: 'Glass', image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=300', ratePerKg: 6.00 },
    { name: 'Aluminum', image: 'https://images.unsplash.com/photo-1657742239061-64b6de9e0c4a?w=300', ratePerKg: 12.00 },
    { name: 'Paper/Cardboard', image: 'https://images.unsplash.com/photo-1719600804011-3bff3909b183?w=300', ratePerKg: 4.00 }
  ];

  // Helper functions for edit form
  const getRatePerKg = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.ratePerKg : 5.00;
  };

  const calculatePayback = (weight, categoryName) => {
    const rate = getRatePerKg(categoryName);
    return (weight || 0) * rate;
  };

  const editSteps = [
    { id: 1, name: 'Category & Items' },
    { id: 2, name: 'Submission Method' },
    { id: 3, name: 'Weight & Payback' },
    { id: 4, name: 'Pickup Details' },
    { id: 5, name: 'Review & Update' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await api.updateProfile(user.id, formData);
      setUser(updatedUser);
      setContextUser(updatedUser);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Failed to update profile";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match!");
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long!");
      setIsLoading(false);
      return;
    }

    try {
      await api.changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setIsChangingPassword(false);
    } catch (err) {
      console.error("Password change error:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Failed to change password";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || ""
    });
    setIsEditing(false);
    setError("");
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setIsChangingPassword(false);
    setError("");
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await logout();
        navigate("/users/login");
      } catch (err) {
        console.error("Logout error:", err);
        setError("Failed to logout. Please try again.");
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                  <p className="text-blue-100">{user.email}</p>
                  <div className="flex items-center mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.emailVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.emailVerified ? '✓ Email Verified' : '✗ Email Not Verified'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
                <button
                  onClick={() => navigate("/home")}
                  className="text-white hover:text-blue-200 transition duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'profile'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Information
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('waste')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'waste'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Waste Submissions
                      {wasteSubmissions.length > 0 && (
                        <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                          {wasteSubmissions.length}
                        </span>
                      )}
                    </div>
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
              <div>
                {/* Profile Information */}
                <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Changing your email will require verification
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                      {isLoading ? "Updating..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                    <p className="text-lg text-gray-900">{user.name}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h3>
                    <p className="text-lg text-gray-900">{user.phone}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email Address</h3>
                    <p className="text-lg text-gray-900">{user.email}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                    <p className="text-lg text-gray-900">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Account Status</h3>
                    <p className="text-lg text-gray-900">
                      {user.emailVerified ? "Active" : "Pending Verification"}
                    </p>
                  </div>
                </div>
              )}
                </div>

                {/* Password Change Section */}
                <div className="border-t pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Security</h2>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {isChangingPassword ? (
                <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 outline-none"
                      required
                      minLength="6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 outline-none"
                      required
                      minLength="6"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                      {isLoading ? "Changing..." : "Change Password"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPasswordChange}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg max-w-md">
                  <p className="text-gray-600">
                    Keep your account secure by using a strong password that you don't use elsewhere.
                  </p>
                </div>
              )}
                </div>
              </div>
            )}

            {/* Waste Submissions Tab */}
            {activeTab === 'waste' && (
              <div>
                {/* Waste Submissions Section */}
                <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Waste Submissions</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchWasteSubmissions(user.id || user._id)}
                    disabled={wasteLoading}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center gap-2"
                  >
                    <svg className={`w-4 h-4 ${wasteLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  <button
                    onClick={() => navigate("/waste-form")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Submit New Waste
                  </button>
                </div>
              </div>

              {wasteLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-gray-600">Loading submissions...</span>
                </div>
              ) : wasteSubmissions.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Waste Submissions Yet</h3>
                  <p className="text-gray-600 mb-4">Start your recycling journey by submitting your first waste items.</p>
                  <button
                    onClick={() => navigate("/waste-form")}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    Submit Your First Waste
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wasteSubmissions.map((submission, index) => (
                      <div key={submission.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              submission.status === 'Completed' 
                                ? 'bg-green-100 text-green-800'
                                : submission.status === 'Processed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {submission.status}
                              {submission.status === 'Pending' && (
                                <span className="ml-1 text-xs">✏️</span>
                              )}
                            </span>
                            <span className="text-xs text-gray-500">
                              {submission.submissionMethod}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {submission.submissionDate ? new Date(submission.submissionDate).toLocaleDateString() : 'N/A'}
                            </span>
                            <div className="flex gap-1">
                              {canEditWaste(submission) ? (
                                <button
                                  onClick={() => handleEditWaste(submission)}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit submission (Pending status)"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              ) : (
                                <div className="p-1 text-gray-400 cursor-not-allowed" title="Cannot edit - not in Pending status">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </div>
                              )}
                              <button
                                onClick={() => handleDeleteWaste(submission.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Delete submission"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Weight:</span>
                            <span className="font-medium">{submission.totalWeightKg} kg</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Payback:</span>
                            <span className="font-medium text-green-600">LKR {submission.totalPaybackAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Payment:</span>
                            <span className={`font-medium ${
                              submission.paymentStatus === 'Completed' 
                                ? 'text-green-600'
                                : submission.paymentStatus === 'Pending'
                                ? 'text-yellow-600'
                                : 'text-gray-600'
                            }`}>
                              {submission.paymentStatus}
                            </span>
                          </div>
                        </div>

                        {submission.items && submission.items.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-600 mb-1">Items:</p>
                            <div className="space-y-1">
                              {submission.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="text-xs text-gray-700">
                                  <span className="font-medium">{item.category}</span>
                                  {item.itemType && item.itemType !== 'N/A' && (
                                    <span className="text-gray-500"> - {item.itemType}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {submission.pickup && submission.pickup.required && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-600 mb-1">Pickup Details:</p>
                            <div className="text-xs text-gray-700">
                              <p>{submission.pickup.date ? new Date(submission.pickup.date).toLocaleDateString() : 'Date TBD'}</p>
                              <p>{submission.pickup.timeSlot || 'Time TBD'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Total Submissions: {wasteSubmissions.length}</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Total Weight: {wasteSubmissions.reduce((sum, sub) => sum + (sub.totalWeightKg || 0), 0).toFixed(2)} kg
                        </p>
                        <p className="text-xs text-blue-700">
                          Total Earned: LKR {wasteSubmissions.reduce((sum, sub) => sum + (sub.totalPaybackAmount || 0), 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Waste Submission Modal */}
      {showEditModal && editingWaste && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Edit Waste Submission</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  {editSteps.map((step) => (
                    <div key={step.id} className="flex-1 text-center">
                      <div className={`text-xs font-medium ${editCurrentStep >= step.id ? 'text-blue-500' : 'text-gray-400'}`}>
                        {step.name}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(editCurrentStep / editSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step Content */}
              <div className="min-h-96">
                {/* Step 1: Category & Items */}
                {editCurrentStep === 1 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Select Category & Items</h2>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">Categories</h3>
                      <div className="grid grid-cols-5 gap-4 mb-6">
                        {categories.map((cat) => (
                          <div
                            key={cat.name}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 ${
                              editFormData.selectedCategory === cat.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                            onClick={() => handleCategorySelect(cat.name)}
                          >
                            <img src={cat.image} alt={cat.name} className="w-full h-24 object-cover rounded mb-2" />
                            <p className="text-center text-sm font-medium">{cat.name}</p>
                            <p className="text-center text-xs text-blue-600 font-semibold mt-1">
                              LKR {cat.ratePerKg}/kg
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Item Description</label>
                      <textarea
                        name="itemDescription"
                        value={editFormData.itemDescription}
                        onChange={handleEditInputChange}
                        rows="3"
                        placeholder="Describe your items"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Submission Method */}
                {editCurrentStep === 2 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Select Submission Method</h2>
                    
                    <div className="grid grid-cols-2 gap-6 max-w-3xl">
                      <div
                        className={`border-2 rounded-lg p-8 cursor-pointer transition-all ${
                          editFormData.submissionMethod === 'Home Pickup'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => handleMethodSelect('Home Pickup')}
                      >
                        <div className="text-center">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Home Pickup</h3>
                          <p className="text-gray-600 text-sm">We'll collect recyclables from your doorstep</p>
                        </div>
                      </div>

                      <div
                        className={`border-2 rounded-lg p-8 cursor-pointer transition-all ${
                          editFormData.submissionMethod === 'Drop-off'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => handleMethodSelect('Drop-off')}
                      >
                        <div className="text-center">
                          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Drop-off</h3>
                          <p className="text-gray-600 text-sm">Bring your recyclables to our collection center</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Weight & Payback */}
                {editCurrentStep === 3 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Weight & Payback Calculation</h2>
                    
                    <div className="max-w-2xl space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Weight (kg) *</label>
                        <input
                          type="number"
                          name="totalWeightKg"
                          value={editFormData.totalWeightKg}
                          onChange={handleEditInputChange}
                          min="0"
                          step="0.1"
                          placeholder="Enter weight in kilograms"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Example: 2.5 kg</p>
                        
                        {editFormData.selectedCategory && editFormData.totalWeightKg > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-blue-800">Estimated Payback:</span>
                              <span className="text-lg font-bold text-blue-600">
                                LKR {calculatePayback(editFormData.totalWeightKg, editFormData.selectedCategory).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-blue-700">Rate: LKR {getRatePerKg(editFormData.selectedCategory).toFixed(2)}/kg</span>
                              <span className="text-xs text-blue-700">Weight: {editFormData.totalWeightKg} kg</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Pickup Details */}
                {editCurrentStep === 4 && editFormData.submissionMethod === 'Home Pickup' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Pickup Details</h2>
                    
                    <div className="max-w-2xl space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Pickup Date *</label>
                        <input
                          type="date"
                          name="pickupDate"
                          value={editFormData.pickupDate}
                          onChange={handleEditInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Time Slot *</label>
                        <select
                          name="pickupTimeSlot"
                          value={editFormData.pickupTimeSlot}
                          onChange={handleEditInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select a time slot</option>
                          <option value="9:00 AM - 12:00 PM">9:00 AM - 12:00 PM</option>
                          <option value="12:00 PM - 3:00 PM">12:00 PM - 3:00 PM</option>
                          <option value="3:00 PM - 6:00 PM">3:00 PM - 6:00 PM</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Address *</label>
                        <textarea
                          name="address"
                          value={editFormData.address}
                          onChange={handleEditInputChange}
                          rows="2"
                          placeholder="House/Apartment number, Street name"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">City *</label>
                          <input
                            type="text"
                            name="city"
                            value={editFormData.city}
                            onChange={handleEditInputChange}
                            placeholder="Enter city"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Zip Code *</label>
                          <input
                            type="text"
                            name="zipCode"
                            value={editFormData.zipCode}
                            onChange={handleEditInputChange}
                            placeholder="Enter zip code"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Review & Update */}
                {editCurrentStep === 5 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Review & Update</h2>
                    
                    <div className="max-w-2xl space-y-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Submission Details</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Category:</span> {editFormData.selectedCategory}</p>
                          <p><span className="font-medium">Method:</span> {editFormData.submissionMethod}</p>
                          <p><span className="font-medium">Weight:</span> {editFormData.totalWeightKg} kg</p>
                          <p><span className="font-medium">Estimated Payback:</span> LKR {calculatePayback(editFormData.totalWeightKg, editFormData.selectedCategory).toFixed(2)}</p>
                          {editFormData.submissionMethod === 'Home Pickup' && (
                            <>
                              <p><span className="font-medium">Pickup Date:</span> {editFormData.pickupDate}</p>
                              <p><span className="font-medium">Time Slot:</span> {editFormData.pickupTimeSlot}</p>
                              <p><span className="font-medium">Address:</span> {editFormData.address}</p>
                              <p><span className="font-medium">City:</span> {editFormData.city}</p>
                              <p><span className="font-medium">Zip Code:</span> {editFormData.zipCode}</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Edit Restrictions</p>
                            <p className="text-xs text-yellow-700 mt-1">
                              You can only edit submissions that are in "Pending" status. 
                              Once approved or processed, only deletion is allowed.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  onClick={prevEditStep}
                  disabled={editCurrentStep === 1}
                  className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {editCurrentStep < 5 ? (
                    <button
                      onClick={nextEditStep}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Next
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={handleUpdateWaste}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Update Submission
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
