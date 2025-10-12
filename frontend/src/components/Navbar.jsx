import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{padding: '10px 20px', background: '#2b6cb0', color: 'white'}}>
      <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
        <Link to="/" style={{color: 'white', textDecoration: 'none', fontWeight: '700'}}>EcoWaste</Link>
        <Link to="/" style={{color: 'white', textDecoration: 'none'}}>Home</Link>
        <Link to="/wasteform" style={{color: 'white', textDecoration: 'none'}}>Add Waste</Link>
      </div>
    </nav>
  );
};

export default Navbar;
