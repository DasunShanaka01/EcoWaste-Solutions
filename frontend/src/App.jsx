import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Home from './Pages/Home/Home.jsx';
import WasteForm from './Pages/Waste/WasteForm.jsx';
import Navbar from './components/Navbar.jsx';
import WasteCollection from './Pages/Collector/WasteCollection.jsx';

import RegisterStep1 from './Pages/Users/RegisterStep1.jsx';
import RegisterStep2 from './Pages/Users/RegisterStep2.jsx';
import Login from './Pages/Users/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { UserProvider } from './Pages/Users/UserContext.jsx'; // ✅ import context provider

function App() {
  return (
    // ✅ Wrap the whole app with UserProvider
    <UserProvider>
      <Navbar />
      <Routes>
        {/* Default: send unknown or root to login/home accordingly */}
        <Route path="/" element={<Navigate to="/users/login" replace />} />
        {/* 🧍 Public (unauthenticated) routes */}
        <Route path="/users/register/step1" element={<RegisterStep1 />} />
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
        <Route path="/" element={<Home />} />
        <Route path="/wasteform" element={<WasteForm />} />
        <Route path="/wastecollection" element={<WasteCollection />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
