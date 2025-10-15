import React, { useState, useEffect } from 'react';
import { useUser } from '../Users/UserContext';

const WasteForm = () => {
  const { user, loading } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    itemDescription: '',
    preferredContact: 'Email',
    submissionMethod: '',
    selectedCategory: '',
    items: [],
    pickupDate: '',
    pickupTimeSlot: '',
    imageFile: null,
    imagePreview: null,
    location: null,
    locationAvailable: false,
    locationError: false,
    weight: 0
  });

  // Populate form with current user data
  useEffect(() => {
    if (user && !loading) {
      console.log('User object:', user); // Debug log
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        phoneNumber: user.phone || '',
        email: user.email || ''
      }));
    }
  }, [user, loading]);

  const categories = [
    { name: 'E-waste', image: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=300' },
    { name: 'Plastic', image: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=300' },
    { name: 'Glass', image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=300' },
    { name: 'Aluminum', image: 'https://images.unsplash.com/photo-1657742239061-64b6de9e0c4a?w=300' },
    { name: 'Paper/Cardboard', image: 'https://images.unsplash.com/photo-1719600804011-3bff3909b183?w=300' }
  ];

  const steps = [
    { id: 1, name: 'Submit Recyclables' },
    { id: 2, name: 'Select Method' },
    { id: 3, name: 'Enter Weight' },
    { id: 4, name: 'Payback Calculation' },
    { id: 5, name: 'Schedule Pickup' },
    { id: 6, name: 'Confirmation' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, selectedCategory: category }));
  };

  const requestGeolocation = () => {
    if (!navigator || !navigator.geolocation) {
      setFormData(prev => ({ ...prev, location: null, locationAvailable: false, locationError: true }));
      return;
    }

    setFormData(prev => ({ ...prev, locationError: false }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setFormData(prev => ({ ...prev, location: coords, locationAvailable: true, locationError: false }));
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setFormData(prev => ({ ...prev, location: null, locationAvailable: false, locationError: true }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMethodSelect = (method) => {
    setFormData(prev => ({ ...prev, submissionMethod: method }));
    if (method === 'Home Pickup') {
      requestGeolocation();
    } else {
      setFormData(prev => ({ ...prev, location: null, locationAvailable: false, locationError: false }));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    try {
      console.log('Starting form submission...');
      console.log('Form data:', formData);
      console.log('User data:', user);
      
      // Validate required fields
      if (!formData.selectedCategory) {
        alert('Please select a category');
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }
      if (!formData.submissionMethod) {
        alert('Please select a submission method');
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }
      if (!formData.weight || formData.weight <= 0) {
        alert('Please enter a valid weight');
        setCurrentStep(3);
        setIsSubmitting(false);
        return;
      }
      if (formData.submissionMethod === 'Home Pickup' && !formData.pickupDate) {
        alert('Please select a pickup date');
        setCurrentStep(5);
        setIsSubmitting(false);
        return;
      }
      if (formData.submissionMethod === 'Home Pickup' && !formData.pickupTimeSlot) {
        alert('Please select a pickup time slot');
        setCurrentStep(5);
        setIsSubmitting(false);
        return;
      }
      
      const formDataToSend = new FormData();

      const location = formData.locationAvailable ? formData.location : { latitude: 0, longitude: 0 };

      formDataToSend.append('userId', user.id || user._id || 'user123');
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('submissionMethod', formData.submissionMethod);
      formDataToSend.append('status', 'Pending');
      formDataToSend.append('totalWeightKg', String(formData.weight || 0));
      formDataToSend.append('totalPaybackAmount', String((formData.weight || 0) * 5));
      formDataToSend.append('paymentMethod', 'Bank Transfer');
      formDataToSend.append('paymentStatus', 'Pending');
      
      const pickup = {
        required: formData.submissionMethod === 'Home Pickup',
        date: formData.pickupDate || null,
        timeSlot: formData.pickupTimeSlot || null,
        address: formData.address || '',
        city: formData.city || '',
        zipCode: formData.zipCode || ''
      };
      formDataToSend.append('pickup', JSON.stringify(pickup));
      
      const items = [{
        category: formData.selectedCategory,
        itemType: formData.itemDescription || 'N/A',
        quantity: 1,
        estimatedWeightKg: formData.weight || 0,
        estimatedPayback: (formData.weight || 0) * 5
      }];
      formDataToSend.append('items', JSON.stringify(items));
      
      formDataToSend.append('location', JSON.stringify(location));
      
      if (formData.imageFile) {
        formDataToSend.append('imageFile', formData.imageFile);
      }

      // Debug: Log all form data being sent
      console.log('FormData contents:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }

      console.log('Sending request to backend...');
      const response = await fetch('http://localhost:8080/api/waste/add', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include' // Include cookies for authentication
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        alert('✅ Waste submission successful! Your recyclables have been submitted for processing.');
        setCurrentStep(6);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorMessage = 'Submission failed. Please try again.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          // If not JSON, use the text as is
          errorMessage = errorText || errorMessage;
        }
        
        alert(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`❌ Network error: ${error.message}. Please check your connection and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Show loading state while user data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  // Show error if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">Please log in to submit waste</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-6">Submit Process</h2>
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 mb-4 p-3 rounded-lg cursor-pointer transition-colors ${
                  currentStep === step.id
                    ? 'bg-green-500 text-white'
                    : currentStep > step.id
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-400'
                }`}
                onClick={() => setCurrentStep(step.id)}
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

          <div className="flex-1 bg-white rounded-lg shadow-sm p-8">
            {/* User Information Header */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Submitting as: {user.name}</h3>
                  <p className="text-sm text-blue-700">{user.email}</p>
                </div>
              </div>
            </div>

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
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Submit Your Recyclables</h2>
                  <p className="text-gray-600 mb-8">Start the process by providing details about your recyclable items</p>
                  
                  <h3 className="text-lg font-semibold mb-4">Categories</h3>
                  <div className="grid grid-cols-5 gap-4 mb-8">
                    {categories.map((cat) => (
                      <div
                        key={cat.name}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:border-green-500 ${
                          formData.selectedCategory === cat.name ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                        onClick={() => handleCategorySelect(cat.name)}
                      >
                        <img src={cat.image} alt={cat.name} className="w-full h-32 object-cover rounded mb-2" />
                        <p className="text-center text-sm font-medium">{cat.name}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name *</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">✓ Pre-filled from your account</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Item Description</label>
                      <textarea
                        name="itemDescription"
                        value={formData.itemDescription}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Describe your items"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number *</label>
                      <div className="relative">
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">✓ Pre-filled from your account</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Upload Photos</label>
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('imageInput').click()}
                      >
                        {formData.imagePreview ? (
                          <img src={formData.imagePreview} alt="Preview" className="max-h-32 mx-auto" />
                        ) : (
                          <>
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-sm text-gray-600">Drag & drop images here or click to browse</p>
                          </>
                        )}
                      </div>
                      <input
                        id="imageInput"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address *</label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">✓ Pre-filled from your account</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Select Submission Method</h2>
                  <p className="text-gray-600 mb-8">Choose how you want to submit your recyclables</p>
                  
                  <div className="grid grid-cols-2 gap-6 max-w-3xl">
                    <div
                      className={`border-2 rounded-lg p-8 cursor-pointer transition-all ${
                        formData.submissionMethod === 'Home Pickup'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => handleMethodSelect('Home Pickup')}
                    >
                      <div className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Home Pickup</h3>
                        <p className="text-gray-600 text-sm">We'll collect recyclables from your doorstep</p>
                      </div>
                    </div>

                    <div
                      className={`border-2 rounded-lg p-8 cursor-pointer transition-all ${
                        formData.submissionMethod === 'Drop-off'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => handleMethodSelect('Drop-off')}
                    >
                      <div className="text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Drop-off</h3>
                        <p className="text-gray-600 text-sm">Bring your recyclables to our collection center</p>
                      </div>
                    </div>
                  </div>

                  {formData.submissionMethod === 'Home Pickup' && (
                    <div className="mt-6 max-w-3xl">
                      {formData.locationAvailable && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <div>
                            <p className="font-medium text-green-800">Location Captured Successfully</p>
                            <p className="text-sm text-green-700 mt-1">
                              Coordinates: {formData.location?.latitude.toFixed(6)}, {formData.location?.longitude.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      )}

                      {formData.locationError && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <p className="font-medium text-yellow-800">Location Access Denied or Unavailable</p>
                              <p className="text-sm text-yellow-700 mt-1">
                                You'll need to enter your address manually in the next steps.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={requestGeolocation}
                            className="text-sm bg-yellow-100 text-yellow-800 px-4 py-2 rounded hover:bg-yellow-200 transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Item Details</h2>
                  <p className="text-gray-600 mb-8">Provide details about the items you're recycling</p>
                  
                  <div className="max-w-2xl space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Selected Category</label>
                      <input
                        type="text"
                        value={formData.selectedCategory || 'Please select a category'}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Weight (kg) *</label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        min="0"
                        step="0.1"
                        placeholder="Enter weight in kilograms"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Example: 2.5 kg</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Payback Calculation</h2>
                  <p className="text-gray-600 mb-8">Review your estimated payback amount</p>
                  
                  <div className="max-w-2xl bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="font-medium">Category:</span>
                        <span>{formData.selectedCategory || 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Total Weight:</span>
                        <span>{formData.weight || 0} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Rate per kg:</span>
                        <span>LKR 5.00</span>
                      </div>
                      <hr className="border-green-300" />
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total Payback:</span>
                        <span className="text-green-600">LKR {((formData.weight || 0) * 5).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && formData.submissionMethod === 'Home Pickup' && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Schedule Pickup & Address Details</h2>
                  <p className="text-gray-600 mb-8">Select a convenient date and time for pickup</p>
                  
                  {formData.locationAvailable && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-green-800">GPS Location Captured</p>
                          <p className="text-sm text-green-700 mt-1">
                            Lat: {formData.location?.latitude.toFixed(6)}, Long: {formData.location?.longitude.toFixed(6)}
                          </p>
                          <p className="text-xs text-green-600 mt-1">Your exact location has been saved for pickup</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="max-w-2xl space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Pickup Date *</label>
                      <input
                        type="date"
                        name="pickupDate"
                        value={formData.pickupDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Time Slot *</label>
                      <select
                        name="pickupTimeSlot"
                        value={formData.pickupTimeSlot}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Select a time slot</option>
                        <option value="9:00 AM - 12:00 PM">9:00 AM - 12:00 PM</option>
                        <option value="12:00 PM - 3:00 PM">12:00 PM - 3:00 PM</option>
                        <option value="3:00 PM - 6:00 PM">3:00 PM - 6:00 PM</option>
                      </select>
                    </div>

                    {!formData.locationAvailable && (
                      <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold mb-4">Pickup Address Details</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Location services unavailable. Please enter your complete address manually
                        </p>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Street Address *</label>
                            <textarea
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              rows="2"
                              placeholder="House/Apartment number, Street name"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">City *</label>
                              <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                placeholder="Enter city"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Zip Code *</label>
                              <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                placeholder="Enter zip code"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                              />
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex gap-3">
                              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <p className="text-sm text-blue-800 font-medium">Manual Location Entry</p>
                                <p className="text-xs text-blue-700 mt-1">
                                  Your GPS location couldn't be determined. We'll use the address you provide for pickup.
                                </p>
                                <button
                                  type="button"
                                  onClick={requestGeolocation}
                                  className="mt-2 text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded hover:bg-blue-200 transition-colors"
                                >
                                  Try Enabling Location Again
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 5 && formData.submissionMethod === 'Drop-off' && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Drop-off Information</h2>
                  <p className="text-gray-600 mb-8">No pickup scheduling needed for drop-off</p>
                  
                  <div className="max-w-2xl bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex gap-4">
                      <svg className="w-8 h-8 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">Drop-off Location</h3>
                        <p className="text-sm text-blue-800 mb-3">
                          You can bring your recyclables to any of our collection centers during operating hours:
                        </p>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Monday - Friday: 8:00 AM - 6:00 PM</li>
                          <li>• Saturday: 9:00 AM - 4:00 PM</li>
                          <li>• Sunday: Closed</li>
                        </ul>
                        <p className="text-xs text-blue-700 mt-3">
                          Find your nearest collection center on our locations page.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Review & Confirm</h2>
                  <p className="text-gray-600 mb-8">Please review your submission details</p>
                  
                  <div className="max-w-2xl space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Personal Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Name:</span> {formData.fullName}</p>
                        <p><span className="font-medium">Email:</span> {formData.email}</p>
                        <p><span className="font-medium">Phone:</span> {formData.phoneNumber}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Submission Details</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Method:</span> {formData.submissionMethod}</p>
                        <p><span className="font-medium">Category:</span> {formData.selectedCategory}</p>
                        <p><span className="font-medium">Weight:</span> {formData.weight} kg</p>
                        <p><span className="font-medium">Estimated Payback:</span> LKR {((formData.weight || 0) * 5).toFixed(2)}</p>
                        {formData.submissionMethod === 'Home Pickup' && (
                          <>
                            <p><span className="font-medium">Pickup Date:</span> {formData.pickupDate}</p>
                            <p><span className="font-medium">Time Slot:</span> {formData.pickupTimeSlot}</p>
                            {formData.locationAvailable ? (
                              <p><span className="font-medium">Location:</span> GPS Coordinates Captured</p>
                            ) : (
                              <>
                                <p><span className="font-medium">Address:</span> {formData.address}</p>
                                <p><span className="font-medium">City:</span> {formData.city}</p>
                                <p><span className="font-medium">Zip Code:</span> {formData.zipCode}</p>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                        isSubmitting 
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Submitting...
                        </div>
                      ) : (
                        'Submit Request'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {currentStep < 6 && (
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Next
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteForm;