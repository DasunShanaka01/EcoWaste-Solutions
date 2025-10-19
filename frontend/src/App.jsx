import React from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Home from './Pages/Home/Home.jsx';
import WasteForm from './Pages/Waste/WasteForm.jsx';
import Navbar from './components/Navbar.jsx';
import WasteCollection from './Pages/Collector/WasteCollection.jsx';
import AdminDashboard from './Pages/Admin/AdminDashboard.jsx';
import CollectorDashboard from './Pages/Collector/CollectorDashboard.jsx';
import CollectionHistory from './Pages/Collector/CollectionHistory.jsx';

import RegisterStep1 from './Pages/Users/RegisterStep1.jsx';
import EmailVerification from './Pages/Users/EmailVerification.jsx';
import RegisterStep2 from './Pages/Users/RegisterStep2.jsx';
import Login from './Pages/Users/Login.jsx';
import UserProfile from './Pages/Users/UserProfile.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { UserProvider } from './Pages/Users/UserContext.jsx'; // ✅ import context provider
import ScheduleSpecial from './Pages/SpecialWaste/ScheduleSpecial.jsx';
import ManageSpecial from './Pages/SpecialWaste/ManageSpecial.jsx';

function AppContent() {
  const location = useLocation();
  
  // Don't show navbar for admin and collector dashboards
  const shouldShowNavbar = !location.pathname.startsWith('/admin/') && 
                          !location.pathname.startsWith('/collector/');

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <Routes>
        {/* Default: send unknown or root to login/home accordingly */}
        <Route path="/" element={<Navigate to="/users/login" replace />} />
        {/* 🧍 Public (unauthenticated) routes */}
        <Route path="/users/register/step1" element={<RegisterStep1 />} />
        <Route path="/users/register/verify" element={<EmailVerification />} />
        <Route path="/users/register/step2" element={<RegisterStep2 />} />
        <Route path="/users/login" element={<Login />} />

        {/* 🏠 Protected routes (login required) */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wasteform"
          element={
            <ProtectedRoute>
              <WasteForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/special/schedule"
          element={
            <ProtectedRoute>
              <ScheduleSpecial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/special/manage"
          element={
            <ProtectedRoute>
              <ManageSpecial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Collector Dashboard */}
        <Route
          path="/collector/dashboard"
          element={
            <ProtectedRoute>
              <CollectorDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Collection History */}
        <Route
          path="/collector/history"
          element={
            <ProtectedRoute>
              <CollectionHistory />
            </ProtectedRoute>
          }
        />
        
        {/* Legacy waste collection route */}
        <Route path="/wastecollection" element={<WasteCollection />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    // ✅ Wrap the whole app with UserProvider
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
