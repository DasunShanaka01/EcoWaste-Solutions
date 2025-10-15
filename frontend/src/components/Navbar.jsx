import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../Pages/Users/UserContext';

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

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

  return (
    <nav style={{padding: '10px 20px', background: '#44a915ff', color: 'white'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
          <Link to="/" style={{color: 'white', textDecoration: 'none', fontWeight: '700'}}>EcoWaste</Link>
          {user && (
            <>
              <Link to="/home" style={{color: 'white', textDecoration: 'none'}}>Home</Link>
              <Link to="/wasteform" style={{color: 'white', textDecoration: 'none'}}>Add Waste</Link>
              <Link to="/wastecollection" style={{color: 'white', textDecoration: 'none'}}>Waste Collection</Link>
              <Link to="/profile" style={{color: 'white', textDecoration: 'none'}}>Profile</Link>
            </>
          )}
        </div>
        
        {user && (
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <span style={{fontSize: '14px'}}>Welcome, {user.name}</span>
            <button
              onClick={handleLogout}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.target.style.background = '#b91c1c'}
              onMouseOut={(e) => e.target.style.background = '#dc2626'}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
