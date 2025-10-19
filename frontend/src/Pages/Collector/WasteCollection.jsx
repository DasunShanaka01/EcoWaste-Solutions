import React, { useState, useEffect, useRef } from 'react';
import Map from '../../components/Map';
import scApi from '../../api/specialCollection';

const WasteCollection = () => {
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

  // Load waste submission locations from backend on mount
  useEffect(() => {
    const GEOCODE_KEY = "AIzaSyBuKrghtMt7e6xdr3TLiGhVZNuqTFTgMXk"; // same key used in Map.jsx

    const geocodeAddress = async (address) => {
      if (!address || address.trim() === '') return null;
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

    const fetchWasteLocations = async () => {
      try {
        // fetch normal wastes
        const res = await fetch('http://localhost:8081/api/waste/wastes', { credentials: 'include' });
        if (!res.ok) {
          console.error('Failed fetching wastes', res.status);
        }
        const data = res.ok ? await res.json() : [];

        const wastesList = Array.isArray(data) ? data : [];
        setWastes(wastesList);

        const normalMarkers = wastesList.map((w, idx) => {
          const rawId = w.id || w._id || w._id || w.id;
          const idStr = rawId && rawId.$oid ? rawId.$oid : (rawId ? String(rawId) : null);
          const loc = w.location || null;
          const latVal = loc && (loc.latitude ?? loc.lat ?? loc.latitude);
          const lngVal = loc && (loc.longitude ?? loc.lng ?? loc.long ?? loc.longitud);
          if (latVal != null && lngVal != null) {
            return {
              lat: Number(latVal),
              lng: Number(lngVal),
              address: (loc && (loc.address || loc.addr)) || (w.pickup && w.pickup.address) || w.fullName || '',
              pointId: idStr || idx,
              type: 'normal',
              // include status so Map component can color markers (e.g. 'Complete' or 'Pending')
              status: w.status || w.state || (w.status === undefined ? null : String(w.status))
            };
          }
          return null;
        }).filter(Boolean);

        // fetch special collections for this user (if any)
        let specialMarkers = [];
        try {
          const specialList = await scApi.listMine();
          if (Array.isArray(specialList) && specialList.length > 0) {
            // geocode each location (best-effort, skip failures)
            const geoPromises = specialList.map(async (sc, sidx) => {
              // If the special collection already includes numeric coordinates, use them directly
              // Common shapes: sc.lat & sc.lng, or sc.location = { lat, lng }
              const latFromSc = sc && (sc.lat ?? (sc.location && (sc.location.lat ?? sc.location.latitude)) );
              const lngFromSc = sc && (sc.lng ?? (sc.location && (sc.location.lng ?? sc.location.longitude)) );
              if (latFromSc != null && lngFromSc != null) {
                return {
                  lat: Number(latFromSc),
                  lng: Number(lngFromSc),
                  address: (sc.address || (sc.location && sc.location.address)) || String(sc.location || sc.notes || '') || '',
                  pointId: sc.id || sc.collectionId || `special-${sidx}`,
                  type: 'special',
                  status: sc.status || null
                };
              }

              // otherwise fall back to geocoding the textual location
              const addr = typeof sc.location === 'string' ? sc.location : String(sc.location || '');
              const geo = await geocodeAddress(addr);
              if (geo) {
                return {
                  lat: Number(geo.lat),
                  lng: Number(geo.lng),
                  address: geo.formattedAddress || addr,
                  pointId: sc.id || sc.collectionId || `special-${sidx}`,
                  type: 'special',
                  status: sc.status || null
                };
              }
              return null;
            });
            const resolved = await Promise.all(geoPromises);
            specialMarkers = resolved.filter(Boolean);
          }
        } catch (e) {
          // listing special collections may fail if not authenticated; ignore
        }

        // compute stats from wastesList
        const totalStops = wastesList.filter(w => w.location && (w.location.latitude != null || w.location.lat != null)).length;
        const completed = wastesList.filter(w => String(w.status || '').toLowerCase() === 'complete').length;
        const remaining = Math.max(0, totalStops - completed);
        setStats({ total: totalStops, completed, remaining });

        setMarkers([...normalMarkers, ...specialMarkers]);
      } catch (e) {
        console.error('Error loading waste locations', e);
      }
    };

    fetchWasteLocations();
  }, []);

  const steps = [
    { id: 1, name: 'Route Overview' },
    { id: 2, name: 'Scan Tag' },
    { id: 3, name: 'Verify Account' },
    { id: 4, name: 'Record Weight' },
    { id: 5, name: 'Confirm Collection' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startRoute = () => {
    setRouteStarted(true);
    setCurrentStep(2);
    setCurrentStop(mockStops[0]);
    captureLocation();
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
          const formats = ['qr_code'];
          const detector = new BarcodeDetectorClass({ formats });
          scanLoopRef.current = setInterval(async () => {
            try {
              if (!videoRef.current) return;
              const results = await detector.detect(videoRef.current);
              if (results && results.length > 0) {
                const q = results[0].rawValue || results[0].displayValue || results[0].raw_text || results[0].rawData;
                stopCamera();
                processQR(q);
              }
            } catch (err) {
              // ignore detection errors per loop
            }
          }, 800);
        } else {
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

    const processQR = async (qrData) => {
      try {
        // send to backend to parse and get user/waste details
        const res = await fetch('http://localhost:8081/api/waste/scan-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ qrData })
        });
        if (!res.ok) {
          setShowError(true);
          setScanning(false);
          return;
        }
        const json = await res.json();
        setScanResult({ success: true, data: json });
        // populate verify account form data
        setFormData(prev => ({
          ...prev,
          tagId: json.wasteId || prev.tagId,
          accountHolder: json.userName || prev.accountHolder,
          address: json.pickup && json.pickup.address ? json.pickup.address : (json.location && json.location.address ? json.location.address : prev.address)
        }));
        setCurrentStep(3);
      } catch (e) {
        console.error('Error processing QR', e);
        setShowError(true);
      } finally {
        setScanning(false);
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
        const res = await fetch('http://localhost:8081/api/waste/scan-qr', {
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
          tagId: json.wasteId || prev.tagId,
          accountHolder: json.userName || prev.accountHolder,
          address: json.pickup && json.pickup.address ? json.pickup.address : (json.location && json.location.address ? json.location.address : prev.address)
        }));
        setCurrentStep(3);
      } catch (e) {
        alert('Error processing QR');
      }
    }
  };

  // Allow manual lookup by waste report ID (no address required)
  const handleManualId = async () => {
    const id = window.prompt('Enter waste report ID (example: 650a5b3f... )');
    if (!id) return;
    try {
      const res = await fetch(`http://localhost:8081/api/waste/${encodeURIComponent(id)}/details`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) return alert('Waste not found');
      const json = await res.json();
      // backend returns a map with waste details, populate scanResult and formData
      setScanResult({ success: true, data: json });
      setFormData(prev => ({
        ...prev,
        tagId: json.wasteId || id,
        accountHolder: json.userName || prev.accountHolder,
        address: (json.pickup && json.pickup.address) || (json.location && json.location.address) || prev.address
      }));
      setCurrentStep(3);
    } catch (e) {
      console.error('Error fetching waste details', e);
      alert('Failed to fetch waste details');
    }
  };

  const handleManualEntry = () => {
    setShowError(false);
    setShowManualEntry(true);
  };

  const confirmAccount = () => {
    setCurrentStep(4);
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

  const [updatingWeight, setUpdatingWeight] = useState(false);

  // Update the given/stored weight on the backend for the current scanned/loaded waste
  const updateGivenWeight = async () => {
    try {
      if (!scanResult || !scanResult.data) return alert('No scanned waste to update');
      const wasteId = scanResult.data.wasteId || formData.tagId;
      if (!wasteId) return alert('No waste id available to update');
      const value = Number(formData.weight);
      if (isNaN(value) || value <= 0) return alert('Please provide a valid weight to update');
      setUpdatingWeight(true);
      const res = await fetch(`http://localhost:8081/api/waste/${encodeURIComponent(wasteId)}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ totalWeightKg: value })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        alert('Failed to update weight: ' + (text || res.status));
        setUpdatingWeight(false);
        return;
      }
      const updated = await res.json().catch(() => null);
      // reflect the change locally
      setScanResult(prev => ({
        ...(prev || {}),
        data: {
          ...(prev?.data || {}),
          weight: value
        }
      }));
      // also update wastes array if present
      setWastes(prev => prev.map(w => {
        const id = w.id || w._id || (w._id && w._id.$oid) || String(w.id);
        if (id && String(id) === String(wasteId)) {
          return { ...w, totalWeightKg: value, totalWeight: value, weight: value };
        }
        return w;
      }));
      setUpdatingWeight(false);
      alert('Given weight updated');
    } catch (e) {
      console.error('Error updating given weight', e);
      setUpdatingWeight(false);
      alert('Error updating weight');
    }
  };

  const confirmCollection = async () => {
    // Optimistically update stats
    const newStats = {
      total: stats.total,
      completed: stats.completed + 1,
      remaining: Math.max(0, stats.remaining - 1)
    };
    setStats(newStats);

    const currentIndex = mockStops.findIndex(s => s.id === currentStop?.id);
    const nextStop = currentIndex >= 0 ? (mockStops[currentIndex + 1] || null) : null;

    // Helper to extract string id from waste record
    const extractId = (w) => {
      if (!w) return null;
      if (typeof w === 'string') return w;
      if (w._id && typeof w._id === 'string') return w._id;
      if (w._id && w._id.$oid) return w._id.$oid;
      if (w.id && typeof w.id === 'string') return w.id;
      if (w.id && w.id.$oid) return w.id.$oid;
      return null;
    };

    // Determine the id to update: prefer scanned wasteId, fallback to formData.tagId or matching wastes
    let updateId = scanResult?.data?.wasteId || formData.tagId || null;
    if (!updateId) {
      // try to locate by matching the tag string in qrCodeBase64 or id fields
      const tag = formData.tagId;
      if (tag) {
        const matched = wastes.find(w => (w.qrCodeBase64 && w.qrCodeBase64.includes(tag))) || wastes.find(w => {
          const idStr = extractId(w);
          return idStr && (idStr === tag || String(idStr) === String(tag));
        });
        updateId = extractId(matched);
      }
    }

    try {
      if (!updateId) {
        // nothing to update; still advance route/UI
        if (nextStop) {
          setCurrentStop(nextStop);
          setCurrentStep(2);
          setScanResult(null);
          setShowError(false);
          setShowManualEntry(false);
          setFormData({
            tagId: '',
            accountHolder: '',
            address: '',
            weight: '',
            wasteType: 'general',
            manualWeight: false,
            location: formData.location,
            timestamp: null
          });
          captureLocation();
        } else {
          setCurrentStep(6);
        }
        return;
      }

      const res = await fetch(`http://localhost:8081/api/waste/${encodeURIComponent(updateId)}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Complete' })
      });

      if (!res.ok) {
        console.error('Failed to mark waste complete', res.status);
        alert('Failed to mark waste as complete on server');
        // rollback stats
        setStats(prev => ({ total: prev.total, completed: Math.max(0, prev.completed - 1), remaining: prev.remaining + 1 }));
        return;
      }

      // Update local wastes array and scanResult
      setWastes(prev => prev.map(w => {
        const idStr = extractId(w);
        if (idStr && String(idStr) === String(updateId)) {
          return { ...w, status: 'Complete' };
        }
        return w;
      }));

      setScanResult(prev => prev ? ({ ...prev, data: { ...(prev.data || {}), status: 'Complete' } }) : prev );

      // Remove the corresponding marker from the map so the completed location no longer shows
      setMarkers(prev => Array.isArray(prev) ? prev.filter(m => String(m.pointId) !== String(updateId)) : prev);

      // Now advance UI (clear scanned data and go to next stop)
      if (nextStop) {
        setCurrentStop(nextStop);
        setCurrentStep(2);
        setScanResult(null);
        setShowError(false);
        setShowManualEntry(false);
        setFormData({
          tagId: '',
          accountHolder: '',
          address: '',
          weight: '',
          wasteType: 'general',
          manualWeight: false,
          location: formData.location,
          timestamp: null
        });
        captureLocation();
      } else {
        setCurrentStep(6);
      }
    } catch (e) {
      console.error('Failed to mark waste complete', e);
      // rollback stats
      setStats(prev => ({ total: prev.total, completed: Math.max(0, prev.completed - 1), remaining: prev.remaining + 1 }));
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
      recordWeight();
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
                  <p className="text-gray-600 mb-8">Start your collection route and scan waste tags at each location</p>

                  <div className="mb-8">
                    <Map markers={markers} liveLocation={formData.location ? { lat: formData.location.latitude, lng: formData.location.longitude } : null} />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Stops</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-6 text-center">
                      <p className="text-sm text-green-700 mb-1">Completed</p>
                      <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-6 text-center">
                      <p className="text-sm text-yellow-700 mb-1">Remaining</p>
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
                          Click the button below to begin your collection route. GPS location services will be enabled automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Scan Tag */}
              {currentStep === 2 && currentStop && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Scan Waste Tag</h2>
                  <p className="text-gray-600 mb-8">Position the scanner near the waste bin tag to read data</p>

                  <div className="mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">Current Stop</p>
                          <p className="text-sm text-blue-800 mt-1">{currentStop.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.location && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div>
                          <p className="font-medium text-green-800">GPS Location Active</p>
                          <p className="text-sm text-green-700 mt-1">
                            Lat: {formData.location.latitude.toFixed(6)}, Long: {formData.location.longitude.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!scanResult && !showError && !showManualEntry && (
                    <div className="max-w-md mx-auto">
                      <div className="bg-gray-50 rounded-lg p-12 text-center mb-6">
                        <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <p className="text-gray-600">Ready to scan waste tag</p>
                      </div>

                      <div className="mb-4">
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-64 bg-black rounded" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleScan}
                          disabled={scanning}
                          className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            scanning
                              ? 'bg-gray-400 cursor-not-allowed text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {scanning ? 'Scanning Tag...' : 'Activate Scanner'}
                        </button>
                        <button onClick={handleManualQR} className="w-full py-3 rounded-lg border border-gray-300 hover:bg-gray-50">Paste QR Text</button>
                        <button onClick={handleManualId} className="w-full py-3 rounded-lg border border-gray-300 hover:bg-gray-50">Enter Waste ID</button>
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
                          Manual entry mode. Please provide account details to continue with collection.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Account Number or Address *</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter account number or address"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (formData.address) {
                            setScanResult({
                              success: true,
                              tagId: 'MANUAL',
                              address: formData.address,
                              accountHolder: 'Manual Entry'
                            });
                            setShowManualEntry(false);
                          } else {
                            alert('Please enter account information');
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                      >
                        Continue with Manual Entry
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
                          <span className="font-semibold text-green-900 text-lg">Tag Scanned Successfully</span>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between py-2 border-b border-green-200">
                            <span className="text-green-700">Tag ID:</span>
                            <span className="font-mono font-semibold text-green-900">{scanResult.data?.wasteId || scanResult.tagId}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-green-200">
                            <span className="text-green-700">Account Holder:</span>
                            <span className="font-semibold text-green-900">{scanResult.data?.userName || scanResult.accountHolder}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-green-700">Location:</span>
                            <span className="font-semibold text-green-900">{(scanResult.data?.pickup && scanResult.data.pickup.address) || (scanResult.data?.location && scanResult.data.location.address) || scanResult.address}</span>
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
                          <span className="text-gray-600">Tag ID:</span>
                          <span className="font-mono font-semibold">{formData.tagId}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Account Holder:</span>
                          <span className="font-semibold">{formData.accountHolder}</span>
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
                  <h2 className="text-2xl font-bold mb-2">Record Waste Weight</h2>
                  <p className="text-gray-600 mb-8">Enter the weight measurement from the vehicle sensor</p>

                  <div className="max-w-2xl space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Collection Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Account:</span> {formData.accountHolder}</p>
                        <p><span className="font-medium">Location:</span> {formData.address}</p>
                        <p><span className="font-medium">Tag ID:</span> {formData.tagId}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Waste Type *</label>
                      <select
                        name="wasteType"
                        value={formData.wasteType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="general">General Waste</option>
                        <option value="recyclable">Recyclable</option>
                        <option value="organic">Organic</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Weight (kg) *
                        {formData.manualWeight && (
                          <span className="ml-2 text-xs text-yellow-600">(Manual Entry)</span>
                        )}
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        step="0.1"
                        placeholder={formData.manualWeight ? "Enter weight manually" : "Auto-detected weight"}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    {!formData.manualWeight && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm text-yellow-800 font-medium">Automatic weight sensor available</p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Weight will be automatically detected when you lift the bin. If the sensor fails, click below to enter manually.
                            </p>
                            <button
                              onClick={handleManualWeight}
                              className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded hover:bg-yellow-200 transition-colors"
                            >
                              Enter Weight Manually
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

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

                    {/* Display given/stored weight (from scanResult) and recorded weight (from sensor/input) */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-500">Given weight (stored)</p>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{scanResult?.data?.weight ?? scanResult?.data?.weight === 0 ? `${scanResult.data.weight} kg` : '—'}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-500">Recorded weight (this collection)</p>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{formData.weight ? `${formData.weight} kg` : '—'}</p>
                        {/* If given weight looks incorrect, allow updating stored weight */}
                        <div className="mt-3">
                          <button
                            onClick={updateGivenWeight}
                            disabled={updatingWeight}
                            className={`w-full py-2 rounded-lg text-sm font-medium ${updatingWeight ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                          >
                            {updatingWeight ? 'Updating…' : 'Update Given Weight'}
                          </button>
                        </div>
                      </div>
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
                          <span className="font-semibold">{formData.weight} kg {formData.manualWeight && '(Manual)'}</span>
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

              {/* Step 6: Route Complete */}
              {currentStep === 6 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Route Completed!</h2>
                  <p className="text-gray-600 mb-8">All collection stops have been successfully processed</p>

                  <div className="max-w-md mx-auto mb-8">
                    <div className="bg-green-50 rounded-lg p-6 mb-4">
                      <h3 className="font-semibold text-green-900 mb-4">Collection Summary</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                          <p className="text-xs text-green-700 mt-1">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                          <p className="text-xs text-gray-600 mt-1">Total Stops</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">{stats.remaining}</p>
                          <p className="text-xs text-yellow-700 mt-1">Remaining</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        Route completion report has been generated and synced to the system.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setRouteStarted(false);
                      setCurrentStep(1);
                      setCurrentStop(null);
                      setScanResult(null);
                      setShowError(false);
                      setShowManualEntry(false);
                      setFormData({
                        tagId: '',
                        accountHolder: '',
                        address: '',
                        weight: '',
                        wasteType: 'general',
                        manualWeight: false,
                        location: null,
                        timestamp: null
                      });
                    }}
                    className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                  >
                    Return to Route Overview
                  </button>
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
                    (currentStep === 4 && !formData.weight)
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Collection Route
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