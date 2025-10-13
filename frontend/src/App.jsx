import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './Pages/Home/Home.jsx';
import WasteForm from './Pages/Waste/WasteForm.jsx';
import Navbar from './components/Navbar.jsx';
import WasteCollection from './Pages/Collector/WasteCollection.jsx';


function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wasteform" element={<WasteForm />} />
        <Route path="/wastecollection" element={<WasteCollection />} />
      </Routes>
    </>
  );
}

export default App;
