import React, { useState, useEffect } from 'react';
import { useWasteCollection } from '../../hooks/useWasteCollection';
import { useCollectionSteps } from '../../hooks/useCollectionSteps';
import { useQRScanner } from '../../hooks/useQRScanner';
import CollectionStepIndicator from '../../components/CollectionStepIndicator';
import RouteOverview from '../../components/RouteOverview';
import QRScanner from '../../components/QRScanner';
import Map from '../../components/Map';

/**
 * Main WasteCollection component - now follows Single Responsibility Principle
 * Only responsible for orchestrating child components and managing form data
 */
const WasteCollection = () => {
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

  const { markers, stats, loading, error, updateStats, removeMarker } = useWasteCollection();
  const { currentStep, routeStarted, steps, startRoute, nextStep, prevStep, resetSteps } = useCollectionSteps();
  const { 
    scanning, 
    scanResult, 
    setScanResult,
    showError, 
    showManualEntry, 
    videoRef, 
    processQR, 
    handleScan, 
    handleManualEntry, 
    resetScanner 
  } = useQRScanner();

  // Handle GPS permission and location capture
  const handleStartRoute = () => {
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
          startRoute();
        },
        (error) => {
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
      alert('GPS is not supported on this device. Please use a device with GPS capabilities.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle QR scan result processing
  const handleQRScanResult = async (qrData) => {
    const result = await processQR(qrData);
    if (result) {
      console.log('QR scan result:', result);
      setFormData(prev => {
        const newData = {
          ...prev,
          tagId: result.accountId || prev.tagId,
          accountHolder: result.userName || prev.accountHolder,
          address: result.address || prev.address
        };
        console.log('Updated form data:', newData);
        return newData;
      });
      nextStep();
    }
  };

  // Handle manual verification
  const handleManualVerification = async (tagId) => {
    if (!tagId) {
      alert('Please enter a waste account ID');
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:8081/api/auth/waste-accounts/scan-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ qrData: tagId })
      });
      
      if (!res.ok) {
        alert('Waste Account ID not found. Please check the ID and try again.');
        return;
      }
      
      const json = await res.json();
      console.log('Manual verification result:', json);
      setScanResult({ success: true, data: json });
      setFormData(prev => {
        const newData = {
          ...prev,
          tagId: json.accountId || tagId,
          accountHolder: json.userName || prev.accountHolder,
          address: json.address || prev.address
        };
        console.log('Updated form data from manual verification:', newData);
        return newData;
      });
      nextStep();
    } catch (e) {
      console.error('Error fetching waste account details', e);
      alert('Failed to verify waste account ID. Please check your connection and try again.');
    }
  };

  const confirmAccount = () => {
    setFormData(prev => ({
      ...prev,
      weight: scanResult?.data?.weight || 'Auto-detected',
      wasteType: scanResult?.data?.wasteType || 'general'
    }));
    nextStep();
  };


  const confirmCollection = async () => {
    try {
      // Validate required fields before sending
      if (!formData.tagId || formData.tagId.trim() === '') {
        alert('Account ID is required. Please ensure the waste account was properly scanned or verified.');
        return;
      }
      
      if (!formData.accountHolder || formData.accountHolder.trim() === '') {
        alert('Account holder is required. Please ensure the waste account was properly scanned or verified.');
        return;
      }

      const requestData = {
        accountId: formData.tagId,
        accountHolder: formData.accountHolder,
        address: formData.address || `Collection location for account ${formData.tagId}`,
        weight: parseFloat(formData.weight) || 0,
        wasteType: formData.wasteType,
        location: formData.location ? {
          latitude: formData.location.latitude,
          longitude: formData.location.longitude,
          address: formData.address || `Collection location for account ${formData.tagId}`
        } : null,
        collectorId: 'current_collector'
      };

      console.log('Sending collection data:', requestData);

      // Save collection data to database using new collection endpoint
      const res = await fetch('http://localhost:8081/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData)
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
      updateStats(newStats);

      // Remove the collected marker from the map
      removeMarker(formData.tagId);

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
      resetScanner();

      // Return to route overview (step 1)
      resetSteps();
      
      // Show success message
      alert('Collection completed successfully! Returning to route overview.');

    } catch (e) {
      console.error('Error saving collection data', e);
      alert('Error saving collection data. Please try again.');
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      handleStartRoute();
    } else if (currentStep === 2 && scanResult) {
      nextStep();
    } else if (currentStep === 3) {
      confirmAccount();
    } else if (currentStep === 4) {
      // Validate weight before proceeding
      if (!formData.weight || parseFloat(formData.weight) <= 0) {
        alert('Please enter a valid weight to continue');
        return;
      }
      nextStep();
    } else if (currentStep === 5) {
      confirmCollection();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-green-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-700 font-medium">Loading waste collection data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Sidebar */}
          <CollectionStepIndicator 
            steps={steps} 
            currentStep={currentStep} 
            routeStarted={routeStarted} 
          />

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
                <RouteOverview 
                  markers={markers} 
                  stats={stats} 
                  liveLocation={formData.location ? { lat: formData.location.latitude, lng: formData.location.longitude } : null}
                  onStartRoute={handleStartRoute}
                />
              )}

              {/* Step 2: Scan Account Tag */}
              {currentStep === 2 && (
                <QRScanner
                  scanning={scanning}
                  scanResult={scanResult}
                  showError={showError}
                  showManualEntry={showManualEntry}
                  videoRef={videoRef}
                  onScan={handleScan}
                  onManualEntry={handleManualEntry}
                  onVerifyManual={handleManualVerification}
                />
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
                          <span className={`font-semibold ${!formData.address ? 'text-orange-600 italic' : ''}`}>
                            {formData.address || 'Not available (optional)'}
                          </span>
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
                  onClick={handleNextStep}
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
                  onClick={handleStartRoute}
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