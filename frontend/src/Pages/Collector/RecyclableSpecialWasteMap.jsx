import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from '../../components/Map';
import scApi from '../../api/specialCollection';
import { QrReader } from 'react-qr-reader';

const RecyclableSpecialWasteMap = () => {
  const navigate = useNavigate();
  const [recyclableMarkers, setRecyclableMarkers] = useState([]);
  const [specialMarkers, setSpecialMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // Manual ID input states (integrated into QR scanner)
  const [manualIdInput, setManualIdInput] = useState('');
  const [manualSearchResult, setManualSearchResult] = useState(null);
  const [manualSearching, setManualSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' or 'manual'
  
  // Payback confirmation states
  const [showPaybackConfirmation, setShowPaybackConfirmation] = useState(false);
  const [paybackData, setPaybackData] = useState(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAll, setShowAll] = useState(false);
  const [filteredRecyclableMarkers, setFilteredRecyclableMarkers] = useState([]);
  const [filteredSpecialMarkers, setFilteredSpecialMarkers] = useState([]);
  
  // Dashboard stats states
  const [stats, setStats] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  // Geocoding function
  const GEOCODE_KEY = "AIzaSyBuKrghtMt7e6xdr3TLiGhVZNuqTFTgMXk";
  const geocodeAddress = async (address) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GEOCODE_KEY}`;
      const r = await fetch(url);
      if (!r.ok) return null;
      const j = await r.json();
      if (j.status === 'OK' && Array.isArray(j.results) && j.results.length > 0) {
        const loc = j.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng, formattedAddress: j.results[0].formatted_address };
      }
    } catch (err) {
      // ignore geocode errors
    }
    return null;
  };

  // Fetch waste locations function
  const fetchWasteLocations = useCallback(async () => {
    try {
      setError(null);

      // First, let's test if the API is working
      console.log('Testing API connectivity...');
      const testRes = await fetch('http://localhost:8081/api/waste/test', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const testData = await testRes.text();
      console.log('API test response:', testData);
      
      // Test the special collections mine endpoint
      console.log('Testing special collections mine endpoint...');
      const testMineRes = await fetch('http://localhost:8081/api/special-collection/mine', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Mine endpoint status:', testMineRes.status);
      
      if (testMineRes.ok) {
        const testMineData = await testMineRes.json();
        console.log('Mine endpoint test data:', testMineData);
      }
      
      // Test the debug endpoint
      console.log('Testing debug endpoint...');
      const debugRes = await fetch('http://localhost:8081/api/special-collection/debug', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Debug endpoint status:', debugRes.status);
      
      if (debugRes.ok) {
        const debugData = await debugRes.text();
        console.log('Debug endpoint data:', debugData);
      } else {
        const debugError = await debugRes.text();
        console.log('Debug endpoint error:', debugError);
      }
      
      // Test the collection check endpoint
      console.log('Testing collection check endpoint...');
      const checkRes = await fetch('http://localhost:8081/api/special-collection/check-collection', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Check collection status:', checkRes.status);
      
      if (checkRes.ok) {
        const checkData = await checkRes.text();
        console.log('Check collection data:', checkData);
      } else {
        const checkError = await checkRes.text();
        console.log('Check collection error:', checkError);
      }

      // Fetch normal wastes and filter for recyclable items
      console.log('Fetching wastes from API...');
      const res = await fetch('http://localhost:8081/api/waste/wastes', { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('API Response status:', res.status);
      if (!res.ok) {
        console.error('Failed fetching wastes', res.status, res.statusText);
        const errorText = await res.text();
        console.error('Error response:', errorText);
      }
      
      const data = res.ok ? await res.json() : [];
      console.log('Raw API response:', data);

      const wastesList = Array.isArray(data) ? data : [];
      console.log('Fetched wastes from MongoDB:', wastesList.length, 'total wastes');
      
      // Debug: Show all unique categories in the database
      const allCategories = wastesList.flatMap(w => w.items || []).map(i => i.category).filter(Boolean);
      const uniqueCategories = [...new Set(allCategories)];
      console.log('All categories found in database:', uniqueCategories);
      
      // Filter for recyclable waste items - make it more flexible
      const recyclableWastes = wastesList.filter(waste => {
        if (!waste.items || !Array.isArray(waste.items)) return false;
        return waste.items.some(item => {
          const category = item.category ? item.category.toLowerCase() : '';
          return category.includes('recyclable') || 
                 category.includes('plastic') || 
                 category.includes('paper') || 
                 category.includes('glass') || 
                 category.includes('metal') ||
                 category.includes('cardboard');
        });
      });
      console.log('Filtered recyclable wastes:', recyclableWastes.length);
      console.log('Sample waste item categories:', wastesList.slice(0, 3).map(w => w.items?.map(i => i.category)));

      const recyclableMarkersList = recyclableWastes.map((w, idx) => {
        const rawId = w.id || w._id || w._id || w.id;
        const idStr = rawId && rawId.$oid ? rawId.$oid : (rawId ? String(rawId) : null);
        const loc = w.location || null;
        
        // Handle MongoDB GeoLocation structure
        let latVal, lngVal, address;
        if (loc) {
          latVal = loc.latitude;
          lngVal = loc.longitude;
          address = loc.address || (w.pickup && w.pickup.address) || w.fullName || '';
        } else {
          // Fallback to pickup details if no GeoLocation
          address = (w.pickup && w.pickup.address) || w.fullName || '';
          // Try to geocode the address if no coordinates
          if (address) {
            geocodeAddress(address).then(geo => {
              if (geo) {
                // Update marker with geocoded coordinates
                setRecyclableMarkers(prev => prev.map(marker => 
                  marker.pointId === idStr ? { ...marker, lat: geo.lat, lng: geo.lng } : marker
                ));
              }
            });
          }
        }
        
        if (latVal != null && lngVal != null) {
          return {
            lat: Number(latVal),
            lng: Number(lngVal),
            address: address,
            pointId: idStr || idx,
            type: 'recyclable',
            status: w.status || w.state || (w.status === undefined ? null : String(w.status)),
            wasteType: 'Recyclable',
            weight: w.totalWeightKg || 0,
            items: w.items || [],
            submissionDate: w.submissionDate,
            fullName: w.fullName
          };
        }
        return null;
      }).filter(Boolean);

      console.log('Created recyclable markers:', recyclableMarkersList.length);
      console.log('Recyclable markers data:', recyclableMarkersList);
      
      setRecyclableMarkers(recyclableMarkersList);

      // Fetch special collections from MongoDB
      let specialMarkersList = [];
      try {
        console.log('Fetching special collections from API...');
        
        // Use the /map endpoint which returns collections for collectors (excluding collected ones)
        console.log('Trying /api/special-collection/map endpoint...');
        const mapRes = await fetch('http://localhost:8081/api/special-collection/map', { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('Map endpoint response status:', mapRes.status);
        
        let specialList = [];
        if (mapRes.ok) {
          specialList = await mapRes.json();
          console.log('Fetched special collections via map endpoint:', specialList.length);
          console.log('Map special collections data:', specialList);
        } else {
          const errorText = await mapRes.text();
          console.log('Map endpoint failed:', mapRes.status, errorText);
        }
        
        console.log('Special collections data:', specialList);
        if (Array.isArray(specialList) && specialList.length > 0) {
          specialMarkersList = specialList.map((sc, sidx) => {
            console.log('Processing special collection:', sc);
            // SpecialCollection has direct latitude and longitude fields
            const latVal = sc.latitude;
            const lngVal = sc.longitude;
            const address = sc.location || '';
            
            console.log('Special collection coordinates:', { latVal, lngVal, address });
            
            if (latVal != null && lngVal != null) {
              const marker = {
                lat: Number(latVal),
                lng: Number(lngVal),
                address: address,
                pointId: sc.id || sc._id || `special-${sidx}`,
                type: 'special',
                status: sc.status || 'Pending',
                wasteType: sc.category || 'Special',
                fee: sc.fee || 0,
                items: sc.items || '',
                date: sc.date || '',
                timeSlot: sc.timeSlot || '',
                quantity: sc.quantity || 0,
                instructions: sc.instructions || '',
                paymentStatus: sc.paymentStatus || 'Unpaid',
                createdAt: sc.createdAt
              };
              console.log('Created special marker:', marker);
              return marker;
            } else {
              console.log('Skipping special collection - no coordinates:', { latVal, lngVal });
            }
            
            // If no coordinates, try to geocode the location string
            if (address) {
              geocodeAddress(address).then(geo => {
                if (geo) {
                  setSpecialMarkers(prev => [...prev, {
                    lat: Number(geo.lat),
                    lng: Number(geo.lng),
                    address: geo.formattedAddress || address,
                    pointId: sc.id || `special-${sidx}`,
                    type: 'special',
                    status: sc.status || 'Pending',
                    wasteType: sc.category || 'Special',
                    fee: sc.fee || 0,
                    items: sc.items || '',
                    date: sc.date || '',
                    timeSlot: sc.timeSlot || '',
                    quantity: sc.quantity || 0,
                    instructions: sc.instructions || '',
                    paymentStatus: sc.paymentStatus || 'Unpaid',
                    createdAt: sc.createdAt
                  }]);
                }
              });
            }
            
            return null;
          }).filter(Boolean);
        }
      } catch (err) {
        console.warn('Failed to fetch special collections:', err);
      }

      console.log('Created special markers:', specialMarkersList.length);
      console.log('Special markers data:', specialMarkersList);
      
      setSpecialMarkers(specialMarkersList);

    } catch (err) {
      console.error('Error fetching waste locations:', err);
      setError('Failed to load collection data');
    }
  }, []);

  // Load dashboard statistics
  const loadStats = useCallback(async () => {
    try {
      const data = await scApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  }, []);

  // Search for collection by ID
  const handleSearch = async () => {
    if (!searchId.trim()) {
      alert('Please enter a collection ID');
      return;
    }

    setSearching(true);
    setSearchResult(null);

    try {
      const data = await scApi.searchCollection(searchId);
      setSearchResult(data);
    } catch (err) {
      console.error('Error searching collection:', err);
      setSearchResult({
        found: false,
        message: 'Error searching for collection'
      });
    } finally {
      setSearching(false);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchWasteLocations(),
        loadStats()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Load recyclable and special waste collection locations from backend
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchWasteLocations(),
          loadStats()
        ]);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [fetchWasteLocations, loadStats]);

  // Combine filtered markers for the map
  const allMarkers = [...filteredRecyclableMarkers, ...filteredSpecialMarkers];
  console.log('All filtered markers for map:', allMarkers.length);
  console.log('All filtered markers data:', allMarkers);

  const getMarkerIcon = (marker) => {
    if (marker.type === 'recyclable') {
      return `http://maps.google.com/mapfiles/ms/icons/green-dot.png`;
    } else if (marker.type === 'special') {
      return `http://maps.google.com/mapfiles/ms/icons/yellow-dot.png`;
    } else if (marker.type === 'test') {
      return `http://maps.google.com/mapfiles/ms/icons/blue-dot.png`;
    }
    return `http://maps.google.com/mapfiles/ms/icons/red-dot.png`;
  };

  // QR Code scanning functionality
  const handleQRScan = async () => {
    if (!qrCodeInput.trim()) {
      alert('Please enter QR code data');
      return;
    }

    setScanning(true);
    setScanResult(null);

    try {
      console.log('Scanning QR code:', qrCodeInput);
      const response = await fetch('http://localhost:8081/api/special-collection/scan-qr', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCodeData: qrCodeInput }),
      });

      const data = await response.json();
      console.log('QR scan response:', data);

      if (response.ok) {
        setScanResult({ 
          success: true, 
          message: data.message, 
          collectionId: data.collectionId, 
          status: data.status, 
          collectedAt: data.collectedAt 
        });
        
        // Refresh the data to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setScanResult({ 
          success: false, 
          message: data.error || 'Failed to scan QR code' 
        });
      }
    } catch (err) {
      console.error('Error scanning QR code:', err);
      setScanResult({ 
        success: false, 
        message: 'Network error or server unreachable' 
      });
    } finally {
      setScanning(false);
    }
  };

  const closeQRScanner = () => {
    setShowQRScanner(false);
    setQrCodeInput('');
    setScanResult(null);
    setUseCamera(false);
    setCameraError(null);
    setManualIdInput('');
    setManualSearchResult(null);
    setManualSearching(false);
    setActiveTab('qr');
    setShowPaybackConfirmation(false);
    setPaybackData(null);
    setUpdatingPayment(false);
  };

  // Handle QR code detection from camera
  const handleQRCodeDetected = (result, error) => {
    console.log('QR detection result:', result);
    console.log('QR detection error:', error);
    
    if (result && result.getText) {
      const data = result.getText();
      if (data && data.trim()) {
        console.log('QR Code detected:', data);
        setQrCodeInput(data);
        setUseCamera(false); // Stop camera scanning
        // Automatically process the detected QR code
        setTimeout(() => {
          handleQRScan();
        }, 500);
      }
    }
  };

  // Handle camera errors
  const handleCameraError = (error) => {
    console.error('Camera error:', error);
    setCameraError('Camera access denied or not available. Please use manual input instead.');
  };

  // Start camera scanning
  const startCameraScan = () => {
    setUseCamera(true);
    setCameraError(null);
    setQrCodeInput('');
    setScanResult(null);
  };

  // Manual ID search functionality
  const handleManualSearch = async () => {
    if (!manualIdInput.trim()) {
      alert('Please enter a collection ID');
      return;
    }

    setManualSearching(true);
    setManualSearchResult(null);

    try {
      console.log('Searching for collection with ID:', manualIdInput);
      
      // Try to find as recyclable waste first
      let response = await fetch(`http://localhost:8081/api/waste/find/${manualIdInput}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let data = await response.json();
      let isRecyclable = response.ok;

      // If not found as recyclable, try special collection search
      if (!response.ok) {
        response = await fetch(`http://localhost:8081/api/special-collection/search/${manualIdInput}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        data = await response.json();
        isRecyclable = false;
      }

      console.log('Manual search response:', data);

      if (response.ok) {
        if (isRecyclable) {
          setManualSearchResult({ 
            success: true, 
            data: data,
            isRecyclable: true,
            message: 'Recyclable waste found!'
          });
        } else {
          // Handle special collection search response
          if (data.found) {
            setManualSearchResult({ 
              success: true, 
              data: data.collection,
              isRecyclable: false,
              message: data.isCollected ? 'Special collection found (already collected)' : 'Special collection found!',
              isCollected: data.isCollected
            });
          } else {
            setManualSearchResult({ 
              success: false, 
              message: data.message || 'Collection not found' 
            });
          }
        }
      } else {
        setManualSearchResult({ 
          success: false, 
          message: data.error || 'Collection not found' 
        });
      }
    } catch (err) {
      console.error('Error searching for collection:', err);
      setManualSearchResult({ 
        success: false, 
        message: 'Network error or server unreachable' 
      });
    } finally {
      setManualSearching(false);
    }
  };

  // Update collection status
  const updateCollectionStatus = async (id, newStatus, isRecyclable) => {
    try {
      const endpoint = isRecyclable 
        ? `http://localhost:8081/api/waste/${id}/status`
        : `http://localhost:8081/api/special-collection/${id}/status`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      console.log('Status update response:', data);

      if (response.ok) {
        setManualSearchResult({ 
          success: true, 
          data: data,
          isRecyclable: isRecyclable,
          message: 'Status updated successfully!'
        });
        
        // Refresh the data to show updated status without page reload
        setTimeout(() => {
          fetchWasteLocations();
          setManualSearchResult(null);
        }, 2000);
      } else {
        alert(`Failed to update status: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`Network error: ${err.message}`);
    }
  };

  // Handle payback confirmation for recyclable waste
  const handlePaybackConfirmation = (wasteData) => {
    setPaybackData(wasteData);
    setShowPaybackConfirmation(true);
  };

  // Update payment status to Complete
  const updatePaymentStatus = async () => {
    if (!paybackData) return;
    
    setUpdatingPayment(true);
    
    try {
      const response = await fetch(`http://localhost:8081/api/waste/${paybackData.simpleId}/payment-status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: 'Complete' }),
      });

      const data = await response.json();
      console.log('Payment status update response:', data);

      if (response.ok) {
        // Update the manual search result with new payment status
        setManualSearchResult(prev => ({
          ...prev,
          data: {
            ...prev.data,
            paymentStatus: 'Complete'
          },
          message: 'Payment confirmed! Now you can mark as collected.'
        }));
        
        setShowPaybackConfirmation(false);
        setPaybackData(null);
      } else {
        alert(`Failed to update payment status: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert(`Network error: ${err.message}`);
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Cancel payback confirmation
  const cancelPaybackConfirmation = () => {
    setShowPaybackConfirmation(false);
    setPaybackData(null);
  };

  // Handle payment confirmation for special collections
  const handlePaymentConfirmation = (collectionData) => {
    setPaybackData(collectionData);
    setShowPaybackConfirmation(true);
  };

  // Update payment status for special collections
  const updateSpecialCollectionPaymentStatus = async () => {
    if (!paybackData) return;
    
    setUpdatingPayment(true);
    
    try {
      const response = await fetch(`http://localhost:8081/api/special-collection/${paybackData.simpleId}/payment-status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: 'Paid' }),
      });

      const data = await response.json();
      console.log('Payment status update response:', data);

      if (response.ok) {
        // Update the manual search result with new payment status
        setManualSearchResult(prev => ({
          ...prev,
          data: {
            ...prev.data,
            paymentStatus: 'Paid'
          },
          message: 'Payment confirmed! Now you can mark as collected.'
        }));
        
        setShowPaybackConfirmation(false);
        setPaybackData(null);
      } else {
        alert(`Failed to update payment status: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert(`Network error: ${err.message}`);
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Filter collections by selected date or show all
  const filterCollectionsByDate = (collections, date, showAll) => {
    if (showAll) return collections;
    if (!date) return collections;
    
    const selectedDateStr = new Date(date).toDateString();
    
    return collections.filter(collection => {
      // For recyclable collections, check submissionDate
      if (collection.submissionDate) {
        const collectionDate = new Date(collection.submissionDate).toDateString();
        return collectionDate === selectedDateStr;
      }
      
      // For special collections, check date field
      if (collection.date) {
        const collectionDate = new Date(collection.date).toDateString();
        return collectionDate === selectedDateStr;
      }
      
      // For special collections, check createdAt
      if (collection.createdAt) {
        const collectionDate = new Date(collection.createdAt).toDateString();
        return collectionDate === selectedDateStr;
      }
      
      return false;
    });
  };

  // Update filtered collections when date, showAll, or original collections change
  useEffect(() => {
    const filteredRecyclable = filterCollectionsByDate(recyclableMarkers, selectedDate, showAll);
    const filteredSpecial = filterCollectionsByDate(specialMarkers, selectedDate, showAll);
    
    setFilteredRecyclableMarkers(filteredRecyclable);
    setFilteredSpecialMarkers(filteredSpecial);
  }, [selectedDate, showAll, recyclableMarkers, specialMarkers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collection data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recyclable & Special Waste Collections</h1>
              <p className="text-sm text-gray-600">View recyclable and special waste collection locations</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQRScanner(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0 0h-4m4 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h4m0 0h4a2 2 0 002-2V9a2 2 0 00-2-2h-4m0 0V5a2 2 0 012-2h4a2 2 0 012 2v4" />
                </svg>
                Scan QR Code / Enter ID
              </button>
              <button
                onClick={refreshData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button
                onClick={() => navigate('/collector/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Collection Legend</h3>
              <p className="text-sm text-gray-600">
                {showAll ? (
                  <span className="font-medium text-green-600">Showing all collections</span>
                ) : (
                  <>
                    Showing collections for: <span className="font-medium text-blue-600">
                      {new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <img 
                  src="http://maps.google.com/mapfiles/ms/icons/green-dot.png" 
                  alt="Recyclable" 
                  className="w-6 h-6"
                />
                <span className="text-sm text-gray-700">
                  Recyclable Waste ({filteredRecyclableMarkers.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="http://maps.google.com/mapfiles/ms/icons/yellow-dot.png" 
                  alt="Special" 
                  className="w-6 h-6"
                />
                <span className="text-sm text-gray-700">
                  Special Waste ({filteredSpecialMarkers.length})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Recyclable Collections</dt>
                    <dd className="text-lg font-medium text-gray-900">{filteredRecyclableMarkers.length}</dd>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Special Collections</dt>
                    <dd className="text-lg font-medium text-gray-900">{filteredSpecialMarkers.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Collections</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.totalCollections || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Collected Today</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.collectedCollections || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Collection Map</h3>
            
            {/* Date Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="dateFilter" className="text-sm font-medium text-gray-700">
                  Filter by Date:
                </label>
                <input
                  type="date"
                  id="dateFilter"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setShowAll(false);
                  }}
                  disabled={showAll}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAll(true);
                    setSelectedDate(new Date().toISOString().split('T')[0]);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                    showAll 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Show All
                </button>
                <button
                  onClick={() => {
                    setShowAll(false);
                    setSelectedDate(new Date().toISOString().split('T')[0]);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                    !showAll 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Today
                </button>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Map 
              markers={allMarkers.map((marker, index) => ({
                ...marker,
                iconUrl: getMarkerIcon(marker),
                label: String(index + 1)
              }))} 
            />
          </div>
        </div>

        {/* Collection Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Collection by ID</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter 6-digit collection ID"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={!searchId.trim() || searching}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searching ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              searchResult.found 
                ? searchResult.isCollected 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {searchResult.found ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h4 className="font-semibold text-gray-900">Collection Found</h4>
                    {searchResult.isCollected && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Already Collected
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium text-gray-600">ID:</span> {searchResult.collection.id}</p>
                      <p><span className="font-medium text-gray-600">Category:</span> {searchResult.collection.category}</p>
                      <p><span className="font-medium text-gray-600">Items:</span> {searchResult.collection.items}</p>
                      <p><span className="font-medium text-gray-600">Quantity:</span> {searchResult.collection.quantity}kg</p>
                    </div>
                    <div>
                      <p><span className="font-medium text-gray-600">Fee:</span> LKR {searchResult.collection.fee}</p>
                      <p><span className="font-medium text-gray-600">Status:</span> {searchResult.collection.status}</p>
                      <p><span className="font-medium text-gray-600">Payment:</span> {searchResult.collection.paymentStatus}</p>
                      <p><span className="font-medium text-gray-600">Date:</span> {searchResult.collection.date}</p>
                    </div>
                  </div>
                  
                  {searchResult.collection.instructions && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm"><span className="font-medium text-gray-600">Instructions:</span> {searchResult.collection.instructions}</p>
                    </div>
                  )}
                  
                  {searchResult.isCollected && (
                    <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> This collection has already been collected and will not appear on the map.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-red-800">{searchResult.message}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collection Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Recyclable Collections */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <img 
                  src="http://maps.google.com/mapfiles/ms/icons/green-dot.png" 
                  alt="Recyclable" 
                  className="w-5 h-5"
                />
                Recyclable Collections
              </h3>
            </div>
            <div className="p-6">
              {filteredRecyclableMarkers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {recyclableMarkers.length === 0 
                    ? 'No recyclable collections found' 
                    : `No recyclable collections found for ${new Date(selectedDate).toLocaleDateString()}`
                  }
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredRecyclableMarkers.map((marker, index) => (
                    <div key={marker.pointId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Collection #{index + 1}</h4>
                          <p className="text-sm text-gray-600 mt-1">{marker.address}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>Weight: {marker.weight}kg</span>
                            <span>Status: {marker.status || 'Pending'}</span>
                            <span>Items: {marker.items?.length || 0}</span>
                          </div>
                          {marker.fullName && (
                            <div className="text-xs text-gray-500 mt-1">
                              Submitted by: {marker.fullName}
                            </div>
                          )}
                          {marker.submissionDate && (
                            <div className="text-xs text-gray-500">
                              Date: {new Date(marker.submissionDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {marker.wasteType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Special Collections */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <img 
                  src="http://maps.google.com/mapfiles/ms/icons/yellow-dot.png" 
                  alt="Special" 
                  className="w-5 h-5"
                />
                Special Collections
              </h3>
            </div>
            <div className="p-6">
              {filteredSpecialMarkers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {specialMarkers.length === 0 
                    ? 'No special collections found' 
                    : `No special collections found for ${new Date(selectedDate).toLocaleDateString()}`
                  }
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredSpecialMarkers.map((marker, index) => (
                    <div key={marker.pointId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Collection #{index + 1}</h4>
                          <p className="text-sm text-gray-600 mt-1">{marker.address}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>Fee: LKR {marker.fee}</span>
                            <span>Qty: {marker.quantity}kg</span>
                            <span>Status: {marker.status}</span>
                          </div>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>Date: {marker.date}</span>
                            <span>Time: {marker.timeSlot}</span>
                            <span>Payment: {marker.paymentStatus}</span>
                          </div>
                          {marker.items && (
                            <div className="text-xs text-gray-500 mt-1">
                              Items: {marker.items}
                            </div>
                          )}
                          {marker.instructions && (
                            <div className="text-xs text-gray-500 mt-1">
                              Instructions: {marker.instructions}
                            </div>
                          )}
                        </div>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {marker.wasteType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeQRScanner}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-md w-full transform transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Scan QR Code / Enter ID</h3>
                <p className="text-gray-600 text-sm">Scan QR code or enter collection ID manually</p>
              </div>
              <button 
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full" 
                onClick={closeQRScanner}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'qr'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                QR Scanner
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'manual'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Enter ID
              </button>
            </div>
            
            <div className="space-y-6">
              {/* QR Scanner Tab */}
              {activeTab === 'qr' && (
                <>
                  {/* Camera Scanner */}
                  {useCamera ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Scan QR Code with Camera</h4>
                    <p className="text-sm text-gray-600">Position the QR code within the camera view</p>
                  </div>
                  
                  <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                    <QrReader
                      delay={300}
                      onError={handleCameraError}
                      onResult={handleQRCodeDetected}
                      style={{ width: '100%', height: '300px' }}
                      constraints={{
                        video: {
                          facingMode: 'environment'
                        }
                      }}
                    />
                    <div className="absolute inset-0 border-2 border-purple-500 rounded-xl pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-lg"></div>
                    </div>
                  </div>
                  
                  {cameraError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                      {cameraError}
                    </div>
                  )}
                  
                  <button
                    onClick={() => setUseCamera(false)}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Switch to Manual Input
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Enter QR Code Data</h4>
                    <p className="text-sm text-gray-600">Type or paste the QR code data below</p>
                  </div>
                  
                  <div>
                    <label htmlFor="qrInput" className="block text-sm font-medium text-gray-700 mb-2">
                      QR Code Data
                    </label>
                    <input
                      type="text"
                      id="qrInput"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="E.g., EWS_COLLECTION:68f66d9e6b03323ae9866e67:collector-001"
                      value={qrCodeInput}
                      onChange={(e) => setQrCodeInput(e.target.value)}
                    />
                  </div>
                  
                  <button
                    onClick={startCameraScan}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use Camera Scanner
                  </button>
                </div>
              )}

              {!useCamera && (
                <button
                  onClick={handleQRScan}
                  disabled={!qrCodeInput || scanning}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {scanning ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0 0h-4m4 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h4m0 0h4a2 2 0 002-2V9a2 2 0 00-2-2h-4m0 0V5a2 2 0 012-2h4a2 2 0 012 2v4" />
                    </svg>
                  )}
                  {scanning ? 'Processing...' : 'Process QR Code'}
                </button>
              )}
                </>
              )}

              {/* Manual Input Tab */}
              {activeTab === 'manual' && (
                <>
                  <div>
                    <label htmlFor="manualIdInput" className="block text-sm font-medium text-gray-700 mb-2">
                      Collection ID (Simple 6-digit ID)
                    </label>
                    <input
                      type="text"
                      id="manualIdInput"
                      value={manualIdInput}
                      onChange={(e) => setManualIdInput(e.target.value)}
                      placeholder="Enter 6-digit ID (e.g., 123456)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the simple 6-digit collection ID (much easier than the full ObjectId!)
                    </p>
                  </div>

                  <button
                    onClick={handleManualSearch}
                    disabled={!manualIdInput || manualSearching}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {manualSearching ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                    {manualSearching ? 'Searching...' : 'Search Collection'}
                  </button>
                  
                  {manualSearchResult && (
                    <div className={`p-4 rounded-xl border ${manualSearchResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      {manualSearchResult.success ? (
                        <div>
                          <p className="font-semibold mb-2">{manualSearchResult.message || 'Collection found!'}</p>
                          
                          {manualSearchResult.isRecyclable ? (
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium">Type:</span> Recyclable Waste</p>
                              <p><span className="font-medium">Simple ID:</span> {manualSearchResult.data.simpleId}</p>
                              <p><span className="font-medium">User:</span> {manualSearchResult.data.userName}</p>
                              <p><span className="font-medium">Category:</span> {manualSearchResult.data.category}</p>
                              <p><span className="font-medium">Weight:</span> {manualSearchResult.data.weight}kg</p>
                              <p><span className="font-medium">Status:</span> {manualSearchResult.data.status}</p>
                              <p><span className="font-medium">Payback Amount:</span> LKR {manualSearchResult.data.paybackAmount}</p>
                              <p><span className="font-medium">Payment Status:</span> 
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                  manualSearchResult.data.paymentStatus === 'Complete' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {manualSearchResult.data.paymentStatus || 'Unpaid'}
                                </span>
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium">Type:</span> Special Collection</p>
                              <p><span className="font-medium">ID:</span> {manualSearchResult.data.id}</p>
                              <p><span className="font-medium">User ID:</span> {manualSearchResult.data.userId}</p>
                              <p><span className="font-medium">Category:</span> {manualSearchResult.data.category}</p>
                              <p><span className="font-medium">Items:</span> {manualSearchResult.data.items}</p>
                              <p><span className="font-medium">Quantity:</span> {manualSearchResult.data.quantity}kg</p>
                              <p><span className="font-medium">Fee:</span> LKR {manualSearchResult.data.fee}</p>
                              <p><span className="font-medium">Status:</span> {manualSearchResult.data.status}</p>
                              <p><span className="font-medium">Payment Status:</span> {manualSearchResult.data.paymentStatus}</p>
                              <p><span className="font-medium">Date:</span> {manualSearchResult.data.date}</p>
                              <p><span className="font-medium">Time Slot:</span> {manualSearchResult.data.timeSlot}</p>
                              {manualSearchResult.isCollected && (
                                <p className="text-red-600 font-semibold">⚠️ This collection has already been collected!</p>
                              )}
                            </div>
                          )}
                          
                          <div className="mt-4 flex gap-2">
                            {manualSearchResult.isRecyclable ? (
                              // Two-step process for recyclable waste
                              <>
                                {manualSearchResult.data.paymentStatus === 'Complete' ? (
                                  // Step 2: Mark as Collected (only after payment is complete)
                                  <button
                                    onClick={() => updateCollectionStatus(
                                      manualSearchResult.data.wasteId,
                                      'Collected',
                                      true
                                    )}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                  >
                                    Mark as Collected
                                  </button>
                                ) : (
                                  // Step 1: Confirm Payback (only if payment not complete)
                                  <button
                                    onClick={() => handlePaybackConfirmation(manualSearchResult.data)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                  >
                                    Confirm Payback (LKR {manualSearchResult.data.paybackAmount})
                                  </button>
                                )}
                                <button
                                  onClick={() => updateCollectionStatus(
                                    manualSearchResult.data.wasteId,
                                    'Pending',
                                    true
                                  )}
                                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                                >
                                  Mark as Pending
                                </button>
                              </>
                            ) : (
                              // Conditional flow for special collections based on payment method
                              <>
                                {(manualSearchResult.data.paymentMethod === 'Cash' || manualSearchResult.data.paymentMethod === 'cash' || (manualSearchResult.data.paymentMethod === null && manualSearchResult.data.paymentStatus === 'Pending')) ? (
                                  // Two-step process for cash payments
                                  <>
                                    {manualSearchResult.data.paymentStatus === 'Paid' ? (
                                      // Step 2: Mark as Collected (only after payment is confirmed)
                                      <button
                                        onClick={() => updateCollectionStatus(
                                          manualSearchResult.data.id,
                                          'Collected',
                                          false
                                        )}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                      >
                                        Mark as Collected
                                      </button>
                                    ) : (
                                      // Step 1: Confirm Payment (only if payment not confirmed)
                                      <button
                                        onClick={() => handlePaymentConfirmation(manualSearchResult.data)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                      >
                                        Confirm Payment (LKR {manualSearchResult.data.fee})
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  // Single step for non-cash payments
                                  <>
                                    <button
                                      onClick={() => updateCollectionStatus(
                                        manualSearchResult.data.id,
                                        'Collected',
                                        false
                                      )}
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                    >
                                      Mark as Collected
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => updateCollectionStatus(
                                    manualSearchResult.data.id,
                                    'Pending',
                                    false
                                  )}
                                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                                >
                                  Mark as Pending
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="font-semibold">{manualSearchResult.message}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {scanResult && (
                <div className={`p-4 rounded-xl border ${scanResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <p className="font-semibold mb-1">{scanResult.message}</p>
                  {scanResult.collectionId && <p className="text-sm">Collection ID: {scanResult.collectionId}</p>}
                  {scanResult.status && <p className="text-sm">Status: {scanResult.status}</p>}
                  {scanResult.collectedAt && <p className="text-sm">Collected At: {new Date(scanResult.collectedAt).toLocaleString()}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaybackConfirmation && paybackData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelPaybackConfirmation}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-md w-full transform transition-all duration-300">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {(paybackData.paymentMethod === 'Cash' || paybackData.paymentMethod === 'cash' || (paybackData.paymentMethod === null && paybackData.paymentStatus === 'Pending')) ? 'Confirm Payment' : 'Confirm Payback'}
              </h3>
              <p className="text-sm text-gray-600">
                {(paybackData.paymentMethod === 'Cash' || paybackData.paymentMethod === 'cash' || (paybackData.paymentMethod === null && paybackData.paymentStatus === 'Pending'))
                  ? 'Please confirm the payment amount for this special collection'
                  : 'Please confirm the payback amount for this recyclable waste collection'
                }
              </p>
            </div>

            {/* Payment/Payback Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">User:</span> {paybackData.userName || paybackData.userId}</p>
                <p><span className="font-medium">Category:</span> {paybackData.category}</p>
                {paybackData.weight && <p><span className="font-medium">Weight:</span> {paybackData.weight}kg</p>}
                <p><span className="font-medium">
                  {(paybackData.paymentMethod === 'Cash' || paybackData.paymentMethod === 'cash' || (paybackData.paymentMethod === null && paybackData.paymentStatus === 'Pending')) ? 'Payment Amount:' : 'Payback Amount:'}
                </span> 
                  <span className="ml-2 text-lg font-bold text-green-600">
                    LKR {(paybackData.paymentMethod === 'Cash' || paybackData.paymentMethod === 'cash' || (paybackData.paymentMethod === null && paybackData.paymentStatus === 'Pending')) ? paybackData.fee : paybackData.paybackAmount}
                  </span>
                </p>
                {(paybackData.paymentMethod === 'Cash' || paybackData.paymentMethod === 'cash' || (paybackData.paymentMethod === null && paybackData.paymentStatus === 'Pending')) && (
                  <p><span className="font-medium">Payment Method:</span> Cash</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelPaybackConfirmation}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={updatingPayment}
              >
                Cancel
              </button>
              <button
                onClick={(paybackData.paymentMethod === 'Cash' || paybackData.paymentMethod === 'cash' || (paybackData.paymentMethod === null && paybackData.paymentStatus === 'Pending')) ? updateSpecialCollectionPaymentStatus : updatePaymentStatus}
                disabled={updatingPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingPayment ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Confirming...
                  </>
                ) : (
                  (paybackData.paymentMethod === 'Cash' || paybackData.paymentMethod === 'cash' || (paybackData.paymentMethod === null && paybackData.paymentStatus === 'Pending')) ? 'Confirm Payment' : 'Confirm Payback'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecyclableSpecialWasteMap;
