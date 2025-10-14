import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './Pages/Home/Home.jsx';
import WasteForm from './Pages/Waste/WasteForm.jsx';
import Navbar from './components/Navbar.jsx';
import RegisterStep1 from './Pages/Users/RegisterStep1.jsx';
import RegisterStep2 from './Pages/Users/RegisterStep2.jsx';
import Login from './Pages/Users/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* 🧍 Public (unauthenticated) routes */}
        <Route path="/users/register/step1" element={<RegisterStep1 />} />
        <Route path="/users/register/step2/:userId" element={<RegisterStep2 />} />
        <Route path="/users/login" element={<Login />} />

        {/* 🏠 Protected routes (login required) */}
        <Route
          path="/"
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
      </Routes>
    </>
  );
}

export default App;
