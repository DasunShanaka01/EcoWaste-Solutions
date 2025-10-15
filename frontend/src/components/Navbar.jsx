import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{padding: '10px 20px', background: '#44a915ff', color: 'white'}}>
      <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
        <Link to="/" style={{color: 'white', textDecoration: 'none', fontWeight: '700'}}>EcoWaste</Link>
        <Link to="/home" style={{color: 'white', textDecoration: 'none'}}>Home</Link>
        <Link to="/wasteform" style={{color: 'white', textDecoration: 'none'}}>Add Waste</Link>
        <Link to="/wastecollection" style={{color: 'white', textDecoration: 'none'}}>Waste Collection</Link>
      </div>
    </nav>
  );
};

export default Navbar;
