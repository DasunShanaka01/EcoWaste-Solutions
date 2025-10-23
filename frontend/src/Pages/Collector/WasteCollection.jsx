import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from '../../components/Map';

const WasteCollection = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [routeStarted, setRouteStarted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showError, setShowError] = useState(false);
  
  const [formData, setFormData] = useState({
    tagId: '',
    accountHolder: '',
    address: '',
    weight: '',
    wasteType: 'general',
    manualWeight: false,
    location: null,
    timestamp: null
  });

  // markers fetched from backend waste submissions
  const [markers, setMarkers] = useState([]);
  const [wastes, setWastes] = useState([]);
  const videoRef = useRef(null);
  const scanLoopRef = useRef(null);

  const [stats, setStats] = useState({
    total: 24,
    completed: 8,
    remaining: 16
  });

  const mockStops = [
    { id: 1, address: '123 Main Street', accountHolder: 'John Smith', tagId: 'TAG001', lat: 6.9271, lng: 79.8612 },
    { id: 2, address: '456 Park Avenue', accountHolder: 'Mary Johnson', tagId: 'TAG002', lat: 6.9280, lng: 79.8620 },
    { id: 3, address: '789 River Road', accountHolder: 'David Brown', tagId: 'TAG003', lat: 6.9290, lng: 79.8630 },
    { id: 4, address: '321 Oak Drive', accountHolder: 'Sarah Wilson', tagId: 'TAG004', lat: 6.9300, lng: 79.8640 }
  ];

  const [currentStop, setCurrentStop] = useState(null);

  // Load waste account locations from backend on mount
  useEffect(() => {

    const fetchWasteLocations = async () => {
      try {
        // First, auto-randomize capacity for waste accounts
        await autoRandomizeCapacity(0.5); // Randomize 50% of accounts
        
        // Then fetch waste accounts
        console.log('Fetching waste accounts from API...');
        const res = await fetch('http://localhost:8081/api/auth/waste-accounts', { credentials: 'include' });
        console.log('API response status:', res.status);
        
        if (!res.ok) {
          console.error('Failed fetching waste accounts', res.status, res.statusText);
          const errorText = await res.text();
          console.error('Error response:', errorText);
          return;
        }
        
        const data = await res.json();
        console.log('Raw API response:', data);

        const wasteAccountsList = Array.isArray(data) ? data.filter(account => account.accountId != null) : [];
        console.log('Processed waste accounts list:', wasteAccountsList);
        setWastes(wasteAccountsList); // Keep using wastes state for compatibility

        const accountMarkers = wasteAccountsList.map((account, idx) => {
          const loc = account.location || null;
          const latVal = loc && (loc.latitude ?? loc.lat);
          const lngVal = loc && (loc.longitude ?? loc.lng);
          if (latVal != null && lngVal != null) {
            return {
              lat: Number(latVal),
              lng: Number(lngVal),
              address: loc.address || '',
              pointId: account.accountId || `account-${idx}`,
              type: 'waste_account',
              status: 'active', // All waste accounts are considered active
              capacity: account.capacity || 0.0 // Include capacity data
            };
          }
          return null;
        }).filter(Boolean);

        console.log('Waste accounts data:', wasteAccountsList);
        console.log('Account markers:', accountMarkers);

        // compute stats from waste accounts
        const totalStops = accountMarkers.length;
        const completed = 0; // No completed status for waste accounts
        const remaining = totalStops;
        setStats({ total: totalStops, completed, remaining });

        setMarkers(accountMarkers);
      } catch (e) {
        console.error('Error loading waste account locations', e);
      }
    };

    fetchWasteLocations();
  }, []);

  const steps = [
    { id: 1, name: 'Route Overview' },
    { id: 2, name: 'Scan Account Tag' },
    { id: 3, name: 'Verify Account' },
    { id: 4, name: 'Record Weight' },
    { id: 5, name: 'Confirm Collection' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startRoute = () => {
    // Request GPS permission before starting route
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // GPS permission granted, start route
          setRouteStarted(true);
          setCurrentStep(2);
          setCurrentStop(mockStops[0]);
          setFormData(prev => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
        },
        (error) => {
          // GPS permission denied or error
          console.warn('GPS permission denied or error:', error);
          alert('GPS permission is required for waste collection. Please enable location services and try again.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      // Geolocation not supported
      alert('GPS is not supported on this device. Please use a device with GPS capabilities.');
    }
  };

  const captureLocation = () => {
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  };

  // Process QR code data - moved outside handleScan to be accessible by other functions
  const processQR = async (qrData) => {
    try {
      console.log('Processing QR data:', qrData);
      
      // Validate QR data format (should be account ID like WA123456789ABC)
      if (!qrData || typeof qrData !== 'string') {
        console.error('Invalid QR data format:', qrData);
        setShowError(true);
        setScanning(false);
        return;
      }
      
      // Check if it looks like a waste account ID
      if (!qrData.startsWith('WA') || qrData.length < 10) {
        console.warn('QR data does not appear to be a waste account ID:', qrData);
        // Still try to process it in case it's valid
      }
      
      // send to backend to parse and get waste account details
      const res = await fetch('http://localhost:8081/api/auth/waste-accounts/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ qrData: qrData.trim() })
      });
      
      console.log('Backend response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Backend error:', res.status, errorText);
        setShowError(true);
        setScanning(false);
        return;
      }
      
      const json = await res.json();
      console.log('Backend response data:', json);
      
      setScanResult({ success: true, data: json });
      // populate verify account form data
      setFormData(prev => ({
        ...prev,
        tagId: json.accountId || prev.tagId,
        accountHolder: json.userName || prev.accountHolder,
        address: json.address || prev.address
      }));
      setCurrentStep(3);
    } catch (e) {
      console.error('Error processing QR', e);
      setShowError(true);
    } finally {
      setScanning(false);
    }
  };

  const handleScan = () => {
    // Start webcam scanner (if supported) or fallback to simulated scan
    setScanning(true);
    setScanResult(null);
    setShowError(false);

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Use BarcodeDetector if available in the browser (guard via window to satisfy ESLint)
        const BarcodeDetectorClass = typeof window !== 'undefined' ? window.BarcodeDetector || null : null;
        if (BarcodeDetectorClass) {
          console.log('BarcodeDetector is available, starting QR detection...');
          const formats = ['qr_code'];
          const detector = new BarcodeDetectorClass({ formats });
          scanLoopRef.current = setInterval(async () => {
            try {
              if (!videoRef.current) return;
              const results = await detector.detect(videoRef.current);
              if (results && results.length > 0) {
                console.log('QR code detected:', results[0]);
                const q = results[0].rawValue || results[0].displayValue || results[0].raw_text || results[0].rawData;
                console.log('Extracted QR data:', q);
                stopCamera();
                processQR(q);
              }
            } catch (err) {
              console.warn('QR detection error (continuing):', err);
              // ignore detection errors per loop
            }
          }, 800);
        } else {
          console.warn('BarcodeDetector not available, falling back to manual entry');
          // No BarcodeDetector: provide user a manual paste fallback after 5s
          setTimeout(() => {
            setShowError(true);
            setScanning(false);
          }, 5000);
        }
      } catch (err) {
        console.warn('Camera unavailable', err);
        setShowError(true);
        setScanning(false);
      }
    };

    const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      if (scanLoopRef.current) {
        clearInterval(scanLoopRef.current);
        scanLoopRef.current = null;
      }
    };

    startCamera();
  };

  // Allow manual QR paste if BarcodeDetector not available
  const handleManualQR = async () => {
    const qr = window.prompt('Paste QR text from the code');
    if (qr) {
      // process same as scanned
      try {
        const res = await fetch('http://localhost:8081/api/auth/waste-accounts/scan-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ qrData: qr })
        });
        if (!res.ok) return alert('Failed to resolve QR');
        const json = await res.json();
        setScanResult({ success: true, data: json });
        setFormData(prev => ({
          ...prev,
          tagId: json.accountId || prev.tagId,
          accountHolder: json.userName || prev.accountHolder,
          address: json.address || prev.address
        }));
        setCurrentStep(3);
      } catch (e) {
        alert('Error processing QR');
      }
    }
  };

  // Allow manual lookup by waste account ID (no address required)
  const handleManualId = async () => {
    const id = window.prompt('Enter waste account ID (example: WA123456789ABC)');
    if (!id) return;
    try {
      const res = await fetch(`http://localhost:8081/api/auth/waste-accounts/scan-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ qrData: id })
      });
      if (!res.ok) return alert('Waste account not found');
      const json = await res.json();
      // backend returns a map with waste account details, populate scanResult and formData
      setScanResult({ success: true, data: json });
      setFormData(prev => ({
        ...prev,
        tagId: json.accountId || id,
        accountHolder: json.userName || prev.accountHolder,
        address: json.address || prev.address
      }));
      setCurrentStep(3);
    } catch (e) {
      console.error('Error fetching waste account details', e);
      alert('Failed to fetch waste account details');
    }
  };

  const handleManualEntry = () => {
    setShowError(false);
    setShowManualEntry(true);
  };

  const confirmAccount = () => {
    // Auto-populate weight and waste type from scan data
    setFormData(prev => ({
      ...prev,
      weight: scanResult?.data?.weight || 'Auto-detected',
      wasteType: scanResult?.data?.wasteType || 'general'
    }));
    setCurrentStep(4); // Move to step 4 (Record Weight)
  };

  const handleManualWeight = () => {
    setFormData(prev => ({ ...prev, manualWeight: true }));
  };

  const recordWeight = () => {
    if (!formData.weight) {
      alert('Please enter weight data');
      return;
    }
    setCurrentStep(5);
  };

  // Auto-randomize capacity for waste accounts on page load
  const autoRandomizeCapacity = async (percentage = 0.5) => {
    try {
      const res = await fetch(`http://localhost:8081/api/auth/waste-accounts/randomize-capacity?percentage=${percentage}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!res.ok) {
        console.warn('Failed to auto-randomize capacity:', res.status, res.statusText);
        return;
      }
      
      console.log('Capacity auto-randomized successfully');
    } catch (e) {
      console.warn('Error auto-randomizing capacity:', e);
    }
  };


  const confirmCollection = async () => {
    try {
      // Prepare collection data to save to database
      const collectionData = {
        accountId: formData.tagId,
        accountHolder: formData.accountHolder,
        address: formData.address,
        weight: parseFloat(formData.weight) || 0,
        wasteType: formData.wasteType,
        location: formData.location,
        timestamp: new Date().toISOString(),
        collectorId: 'current_collector', // You might want to get this from user context
        status: 'collected'
      };

      console.log('Saving collection data:', collectionData);

      // Save collection data to database using new collection endpoint
      const res = await fetch('http://localhost:8081/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accountId: formData.tagId,
          accountHolder: formData.accountHolder,
          address: formData.address,
          weight: parseFloat(formData.weight) || 0,
          wasteType: formData.wasteType,
          location: formData.location ? {
            latitude: formData.location.latitude,
            longitude: formData.location.longitude,
            address: formData.address
          } : null,
          collectorId: 'current_collector' // You might want to get this from user context
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to save collection data', res.status, errorText);
        alert('Failed to save collection data. Please try again.');
        return;
      }

      const response = await res.json();
      console.log('Collection saved successfully:', response);
      
      if (!response.success) {
        console.error('Collection save failed:', response.error);
        alert('Failed to save collection data: ' + response.error);
        return;
      }

      // Update stats
      const newStats = {
        total: stats.total,
        completed: stats.completed + 1,
        remaining: Math.max(0, stats.remaining - 1)
      };
      setStats(newStats);

      // Remove the collected marker from the map
      setMarkers(prev => Array.isArray(prev) ? prev.filter(m => String(m.pointId) !== String(formData.tagId)) : prev);

      // Reset form data and return to route overview
      setFormData({
        tagId: '',
        accountHolder: '',
        address: '',
        weight: '',
        wasteType: 'general',
        manualWeight: false,
        location: formData.location, // Keep current location
        timestamp: null
      });

      // Clear scan results and errors
      setScanResult(null);
      setShowError(false);
      setShowManualEntry(false);

      // Return to route overview (step 1)
      setCurrentStep(1);
      
      // Show success message
      alert('Collection completed successfully! Returning to route overview.');

    } catch (e) {
      console.error('Error saving collection data', e);
      alert('Error saving collection data. Please try again.');
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      startRoute();
    } else if (currentStep === 2 && scanResult) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      confirmAccount();
    } else if (currentStep === 4) {
      // Validate weight before proceeding
      if (!formData.weight || parseFloat(formData.weight) <= 0) {
        alert('Please enter a valid weight to continue');
        return;
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      confirmCollection();
    }
  };

  const prevStep = () => {
    if (currentStep > 2) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-6">Collection Process</h2>
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 mb-4 p-3 rounded-lg transition-colors ${
                  currentStep === step.id
                    ? 'bg-green-500 text-white'
                    : currentStep > step.id
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep === step.id ? 'bg-white text-green-500' : 'bg-gray-200'
                }`}>
                  {step.id}
                </div>
                <span className="text-sm">{step.name}</span>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex-1 text-center">
                    <div className={`text-xs font-medium ${currentStep >= step.id ? 'text-green-500' : 'text-gray-400'}`}>
                      {step.name}
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="min-h-96">
              {/* Step 1: Route Overview */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Waste Collection Route</h2>
                  <p className="text-gray-600 mb-8">Start your collection route and visit waste bin locations to collect waste</p>

                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Waste Bin Locations</h3>
                      <div className="text-sm text-gray-600">
                        Capacity automatically updated on page refresh
                      </div>
                    </div>
                    
                    {/* Priority Location Indicator */}
                    {markers.length > 0 && (() => {
                      // Sort markers by capacity descending (same logic as Map component)
                      const sortedMarkers = [...markers].sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
                      const highestCapacityMarker = sortedMarkers[0];
                      console.log('WasteCollection - Sorted markers by capacity:', sortedMarkers.map(m => ({ id: m.pointId, capacity: m.capacity, address: m.address })));
                      console.log('WasteCollection - Highest capacity marker:', highestCapacityMarker);
                      
                      return (
                        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">1</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-orange-800">Priority Collection Point</span>
                                <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">HIGHEST CAPACITY</span>
                              </div>
                              <p className="text-sm text-orange-700 mt-1">
                                {highestCapacityMarker?.address || 'Location details not available'} - 
                                Capacity: {highestCapacityMarker?.capacity?.toFixed(1) || '0.0'}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    <Map markers={markers} liveLocation={formData.location ? { lat: formData.location.latitude, lng: formData.location.longitude } : null} />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Bins</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-6 text-center">
                      <p className="text-sm text-blue-700 mb-1">Active Bins</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-6 text-center">
                      <p className="text-sm text-yellow-700 mb-1">Available</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.remaining}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex gap-4">
                      <svg className="w-8 h-8 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">Ready to Start Collection</h3>
                        <p className="text-sm text-blue-800">
                          Click the button below to begin your collection route. You will visit waste bin locations to collect waste. GPS permission is required for location tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Scan Account Tag */}
              {currentStep === 2 && currentStop && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Scan Waste Bin Tag</h2>
                  <p className="text-gray-600 mb-8">Position the scanner near the waste bin tag to read data</p>

                  <div className="mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">Current Location (Live GPS)</p>
                          <p className="text-sm text-blue-800 mt-1">
                            {formData.location ? 
                              `Lat: ${formData.location.latitude.toFixed(6)}, Lng: ${formData.location.longitude.toFixed(6)}` : 
                              'GPS location not available'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>


                  {!scanResult && !showError && !showManualEntry && (
                    <div className="max-w-md mx-auto">
                      <div className="bg-gray-50 rounded-lg p-12 text-center mb-6">
                        <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <p className="text-gray-600">Ready to scan waste bin tag</p>
                        <p className="text-xs text-gray-500 mt-2">
                          QR codes should contain waste account IDs (e.g., WA123456789ABC)
                        </p>
                      </div>

                      <div className="mb-4">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-64 bg-black rounded" />
                        {scanning && (
                          <div className="mt-2 text-center">
                            <div className="inline-flex items-center gap-2 text-sm text-blue-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              Scanning for QR codes...
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center">
                        <button
                          onClick={handleScan}
                          disabled={scanning}
                          className={`w-full max-w-xs py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            scanning
                              ? 'bg-gray-400 cursor-not-allowed text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {scanning ? 'Scanning Bin Tag...' : 'Activate Scanner'}
                        </button>
                      </div>
                    </div>
                  )}

                  {showError && (
                    <div className="max-w-md mx-auto">
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-semibold text-red-900">Tag Read Failure</span>
                        </div>
                        <p className="text-sm text-red-700 mb-4">
                          Unable to read tag. The tag may be damaged or missing. You can enter the information manually or take photos for investigation.
                        </p>
                      </div>

                      <button
                        onClick={handleManualEntry}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors mb-3"
                      >
                        Enter Manual Data
                      </button>

                      <button
                        onClick={handleScan}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Try Scanning Again
                      </button>
                    </div>
                  )}

                  {showManualEntry && (
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-yellow-800">
                          Manual entry mode. Please enter the waste account ID to verify the account and continue with collection.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Waste Account ID *</label>
                        <input
                          type="text"
                          name="tagId"
                          value={formData.tagId}
                          onChange={handleInputChange}
                          placeholder="Enter waste account ID (e.g., WA123456789ABC)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        onClick={async () => {
                          if (formData.tagId) {
                            try {
                              const res = await fetch(`http://localhost:8081/api/auth/waste-accounts/scan-qr`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ qrData: formData.tagId })
                              });
                              if (!res.ok) {
                                alert('Waste Account ID not found. Please check the ID and try again.');
                                return;
                              }
                              const json = await res.json();
                              setScanResult({ success: true, data: json });
                              setFormData(prev => ({
                                ...prev,
                                tagId: json.accountId || formData.tagId,
                                accountHolder: json.userName || prev.accountHolder,
                                address: json.address || prev.address
                              }));
                              setShowManualEntry(false);
                              setCurrentStep(3);
                            } catch (e) {
                              console.error('Error fetching waste account details', e);
                              alert('Failed to verify waste account ID. Please check your connection and try again.');
                            }
                          } else {
                            alert('Please enter a waste account ID');
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                      >
                        Verify Waste Account ID
                      </button>
                    </div>
                  )}

                  {scanResult?.success && (
                    <div className="max-w-md mx-auto">
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="font-semibold text-green-900 text-lg">Bin Tag Scanned Successfully</span>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between py-2 border-b border-green-200">
                            <span className="text-green-700">Account ID:</span>
                            <span className="font-mono font-semibold text-green-900">{scanResult.data?.accountId || scanResult.tagId}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-green-200">
                            <span className="text-green-700">Account Holder:</span>
                            <span className="font-semibold text-green-900">{scanResult.data?.userName || scanResult.accountHolder}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-green-200">
                            <span className="text-green-700">Capacity:</span>
                            <span className="font-semibold text-green-900">{scanResult.data?.capacity ? `${scanResult.data.capacity.toFixed(1)}%` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-green-700">Location:</span>
                            <span className="font-semibold text-green-900">{scanResult.data?.address || scanResult.address}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2 text-sm text-gray-600 mb-6">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Verify Account */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Verify Account Information</h2>
                  <p className="text-gray-600 mb-8">Confirm the account details match the collection location</p>

                  <div className="max-w-2xl space-y-4">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Account Details</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Account ID:</span>
                          <span className="font-mono font-semibold">{formData.tagId}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Account Holder:</span>
                          <span className="font-semibold">{formData.accountHolder}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Capacity:</span>
                          <span className="font-semibold">{scanResult?.data?.capacity ? `${scanResult.data.capacity.toFixed(1)}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-semibold">{formData.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm text-blue-800 font-medium">Verification Required</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Please verify that the information above matches the collection location before proceeding.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Record Weight */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Record Weight</h2>
                  <p className="text-gray-600 mb-8">Enter the weight of the collected waste manually</p>

                  <div className="max-w-2xl space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Collection Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Account:</span> {formData.accountHolder}</p>
                        <p><span className="font-medium">Location:</span> {formData.address}</p>
                        <p><span className="font-medium">Account ID:</span> {formData.tagId}</p>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Weight Entry</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Waste Weight (kg) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="weight"
                              value={formData.weight}
                              onChange={handleInputChange}
                              step="0.1"
                              min="0.1"
                              max="1000"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter weight in kilograms"
                              required
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 text-sm">kg</span>
                            </div>
                          </div>
                          {!formData.weight && (
                            <p className="text-red-500 text-xs mt-1">Weight is required to continue</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Waste Type
                          </label>
                          <select
                            name="wasteType"
                            value={formData.wasteType}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="general">General Waste</option>
                            <option value="E-waste">E-waste</option>
                            <option value="Plastic">Plastic</option>
                            <option value="Glass">Glass</option>
                            <option value="Aluminum">Aluminum</option>
                            <option value="Paper/Cardboard">Paper/Cardboard</option>
                          </select>
                        </div>

                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{new Date().toLocaleTimeString()}</span>
                      {formData.location && (
                        <>
                          <span className="mx-2">•</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>GPS: {formData.location.latitude.toFixed(4)}, {formData.location.longitude.toFixed(4)}</span>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* Step 5: Confirm Collection */}
              {currentStep === 5 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Confirm Collection</h2>
                  <p className="text-gray-600 mb-8">Review collection details before confirming</p>

                  <div className="max-w-2xl space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Collection Summary</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Tag ID:</span>
                          <span className="font-mono font-semibold">{formData.tagId}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Account Holder:</span>
                          <span className="font-semibold">{formData.accountHolder}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-semibold">{formData.address}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Waste Type:</span>
                          <span className="font-semibold capitalize">{formData.wasteType}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Weight:</span>
                          <span className="font-semibold">{formData.weight} kg (Manual Entry)</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Timestamp:</span>
                          <span className="font-semibold">{new Date().toLocaleString()}</span>
                        </div>
                        {formData.location && (
                          <div className="flex justify-between py-2">
                            <span className="text-gray-600">GPS Location:</span>
                            <span className="font-mono text-xs">{formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex gap-3">
                        <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-green-800">Ready to Confirm</p>
                          <p className="text-sm text-green-700 mt-1">
                            Collection data will be saved and synced to the system. The account will be updated with this collection record.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Navigation Buttons */}
            {currentStep < 6 && routeStarted && (
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 2}
                  className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 2 && !scanResult) ||
                    (currentStep === 4 && (!formData.weight || parseFloat(formData.weight) <= 0))
                  }
                  className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStep === 5 ? 'Confirm Collection' : 'Next'}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Start Route Button */}
            {currentStep === 1 && !routeStarted && (
              <div className="flex justify-end mt-8 pt-6 border-t">
                  <button
                    onClick={startRoute}
                    className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Start Collection Route (GPS Required)
                  </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteCollection;