import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Pages/Home/Home.jsx';
import WasteForm from './Pages/Waste/WasteForm.jsx';


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        
        <Route path="/" element={<Home />} />
        <Route path="/wasteform" element={<WasteForm />} />
      
      </Routes>
    </Router>
  );
}

export default App;
