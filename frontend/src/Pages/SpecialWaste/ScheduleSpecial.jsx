import React, { useEffect, useMemo, useState } from 'react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import scApi from '../../api/specialCollection';

const categories = [
  { key: 'Bulky', items: ['Sofa', 'Refrigerator', 'Mattress', 'Table', 'Chair'], img: '/bulky.png' },
  { key: 'Hazardous', items: ['Batteries', 'Paint', 'Chemicals'], img: '/hazardous.png' },
  { key: 'Organic', items: ['Leaves', 'Branches bundle', 'Kitchen waste'], img: '/organic.png' },
  { key: 'E-Waste', items: ['TV', 'Computer', 'Printer'], img: '/ewaste.png' },
  { key: 'Recyclable', items: ['Plastic', 'Paper', 'Glass', 'Metal'], img: '/recycle.png' },
  { key: 'Other', items: [], img: '/other.png' },
  { key: 'Bulky', items: ['Sofa', 'Refrigerator', 'Mattress', 'Table', 'Chair'], img: 'https://media.istockphoto.com/id/2196163100/photo/trailer-with-bulky-waste-from-a-household-clearance.jpg?s=2048x2048&w=is&k=20&c=sxZXpRwI5g8rzQC3mhrqpqI69rZNq7yiXG8aWoji7uI=' },
  { key: 'Hazardous', items: ['Batteries', 'Paint', 'Chemicals'], img: 'https://images.unsplash.com/photo-1591268285986-e6ad4dbf14f7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687' },
  { key: 'Organic', items: ['Leaves', 'Branches bundle', 'Kitchen waste'], img: 'https://plus.unsplash.com/premium_photo-1723373960718-c26efde88d6d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=688' },
  { key: 'E-Waste', items: ['TV', 'Computer', 'Printer'], img: 'https://images.unsplash.com/photo-1612965110667-4175024b0dcc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=735' },
  { key: 'Recyclable', items: ['Plastic', 'Paper', 'Glass', 'Metal'], img: 'https://media.istockphoto.com/id/664980412/photo/trash-for-recycle-and-reduce-ecology-environment.jpg?s=2048x2048&w=is&k=20&c=9Rcwfkp-XgJMRo45m5irHEi2Xpi7szbhpET8m59nfKc=' },
  { key: 'Other', items: [], img: 'https://media.istockphoto.com/id/2206222682/photo/waste-collection.jpg?s=2048x2048&w=is&k=20&c=cAj5HB_Qf8sDyYTzYy6aa_sSHGO54LaE97EX03xyWB0=' },
];

const locations = ['Front door', 'Garage', 'Building lobby'];

export default function ScheduleSpecial() {
  const locationHook = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1..8
  const [category, setCategory] = useState('');
  const [item, setItem] = useState('');
  const [otherDesc, setOtherDesc] = useState('');
  const [quantity, setQuantity] = useState(0);
  // const [category, setCategory] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  // const [item, setItem] = useState('');
  // const [otherDesc, setOtherDesc] = useState('');
  // const [quantity, setQuantity] = useState(0);
  const [categoryItems, setCategoryItems] = useState({}); // Store items for each category
  const [categoryQuantities, setCategoryQuantities] = useState({}); // Store quantities for each category
  const [fee, setFee] = useState(0);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [timeSlot, setTimeSlot] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [location, setLocation] = useState(null);
  const [locationAvailable, setLocationAvailable] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [customLocation, setCustomLocation] = useState(null);
  const [customLocationSet, setCustomLocationSet] = useState(false);
  // const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scheduled, setScheduled] = useState(null);
  const [paid, setPaid] = useState(false);
  const [hasUnpaid, setHasUnpaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'bank' | 'cash'
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankSlip, setBankSlip] = useState(null);
  const [cashNotes, setCashNotes] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const steps = [
    { id: 1, name: 'Waste Category' },
    { id: 2, name: 'Items / Quantity' },
    { id: 3, name: 'Calendar & Time' },
    { id: 4, name: 'Pickup Location' },
    { id: 5, name: 'Order Summary' },
    { id: 6, name: 'Payment' },
    { id: 7, name: 'Confirmation' }
  ];

  const itemList = useMemo(() => {
    const c = categories.find(c => c.key === category);
    return c ? c.items : [];
  }, [category]);
  // const itemList = useMemo(() => {
  //   const c = categories.find(c => c.key === category);
  //   return c ? c.items : [];
  // }, [category]);

  useEffect(() => {
    scApi.getDates().then(setDates).catch(() => setDates([]));
    // client guard: detect unpaid collections
    scApi.listMine().then(list => {
      const unpaid = (list || []).some(it => (it.paymentStatus || '').toLowerCase() === 'unpaid');
      setHasUnpaid(unpaid);
    }).catch(() => setHasUnpaid(false));
    // if navigated from Manage with a specific unpaid item, focus payment step
    if (locationHook?.state?.payFor) {
      const payItem = locationHook.state.payFor;
      setScheduled({ collectionId: payItem.id, fee: payItem.fee });
      setCategory(payItem.category);
      setItem(payItem.items || '');
      setQuantity(payItem.quantity || 0);
      // setCategory(payItem.category);
      // setItem(payItem.items || '');
      // setQuantity(payItem.quantity || 0);
      setSelectedDate(payItem.date);
      setTimeSlot(payItem.timeSlot);
      setPickupLocation(payItem.location || '');
      setInstructions(payItem.instructions || '');
      setStep(6);
    }
  }, []);

  useEffect(() => {
    if (!category || Number(quantity) <= 0) {
      setFee(0);
      return;
    }
    scApi.calculateFee({ category, items: item || otherDesc, quantity: Number(quantity) })
      .then(r => setFee(r.fee || 0))
      .catch(() => setFee(0));
  }, [category, item, otherDesc, quantity]);
  }, [locationHook?.state?.payFor]);

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setFee(0);
      return;
    }
    
    // Calculate fee for multiple categories
    const calculateMultiCategoryFee = async () => {
      try {
        let totalFee = 0;
        for (const cat of selectedCategories) {
          const categoryQuantity = categoryQuantities[cat];
          const categoryItem = categoryItems[cat];
          
          if (categoryQuantity && categoryQuantity > 0 && categoryItem) {
            const feeRequest = {
              category: cat,
              items: categoryItem,
              quantity: categoryQuantity
            };
            const response = await scApi.calculateFee(feeRequest);
            totalFee += response.fee || 0;
          }
        }
        setFee(totalFee);
      } catch (error) {
        console.error('Error calculating fee:', error);
        setFee(0);
      }
    };
    
    calculateMultiCategoryFee();
  }, [selectedCategories, categoryItems, categoryQuantities]);

  useEffect(() => {
    if (selectedDate) {
      scApi.getSlots(selectedDate).then(setSlots).catch(() => setSlots([]));
    } else {
      setSlots([]);
    }
  }, [selectedDate]);

  const canNext = () => {
    if (step === 1) return !!category;
    if (step === 2) {
      const hasItem = category === 'Other' ? !!otherDesc : !!item;
      return hasItem && Number(quantity) > 0;
    }
    if (step === 3) return !!selectedDate && !!timeSlot;
    if (step === 4) return !!pickupLocation;
  const requestGeolocation = () => {
    if (!navigator || !navigator.geolocation) {
      setLocation(null);
      setLocationAvailable(false);
      setLocationError(true);
      return;
    }

    setLocationError(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { 
          latitude: position.coords.latitude, 
          longitude: position.coords.longitude,
          address: 'Current Location'
        };
        setLocation(coords);
        setLocationAvailable(true);
        setLocationError(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocation(null);
        setLocationAvailable(false);
        setLocationError(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleLocationSearch = async () => {
    if (!locationSearchQuery.trim()) {
      alert('Please enter a location to search');
      return;
    }

    try {
      // Using Google Places API for location search
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationSearchQuery)}&key=AIzaSyBuKrghtMt7e6xdr3TLiGhVZNuqTFTgMXk`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          address: result.formatted_address
        };
        
        setCustomLocation(location);
        setCustomLocationSet(true);
        // setShowLocationPicker(false);
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Location search error:', error);
      alert('Error searching for location. Please try again.');
    }
  };

  // const toggleLocationPicker = () => {
  //   setShowLocationPicker(!showLocationPicker);
  // };

  const useCustomLocation = () => {
    if (customLocation) {
      setLocation({
        latitude: customLocation.latitude,
        longitude: customLocation.longitude,
        address: customLocation.address
      });
      setLocationAvailable(true);
      setLocationError(false);
      // setShowLocationPicker(false);
    }
  };

  // const handleCategorySelect = (category) => {
  //   setCategory(category);
  // };

  // const toggleCategory = (categoryKey) => {
  //   setSelectedCategories(prev => {
  //     if (prev.includes(categoryKey)) {
  //       return prev.filter(cat => cat !== categoryKey);
  //     } else {
  //       return [...prev, categoryKey];
  //     }
  //   });
  // };

  const handleMultiCategorySelect = (categoryKey) => {
    if (selectedCategories.includes(categoryKey)) {
      setSelectedCategories(prev => prev.filter(cat => cat !== categoryKey));
      // Remove items and quantities for deselected category
      setCategoryItems(prev => {
        const newItems = { ...prev };
        delete newItems[categoryKey];
        return newItems;
      });
      setCategoryQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[categoryKey];
        return newQuantities;
      });
    } else {
      setSelectedCategories(prev => [...prev, categoryKey]);
    }
  };

  const handleCategoryItemChange = (categoryKey, item) => {
    setCategoryItems(prev => ({
      ...prev,
      [categoryKey]: item
    }));
  };

  const handleCategoryQuantityChange = (categoryKey, quantity) => {
    setCategoryQuantities(prev => ({
      ...prev,
      [categoryKey]: Number(quantity)
    }));
  };

  const canNext = () => {
    if (step === 1) return selectedCategories.length > 0;
    if (step === 2) {
      // Check if all selected categories have items and quantities
      return selectedCategories.every(cat => {
        const hasItem = cat === 'Other' ? !!categoryItems[cat] : !!categoryItems[cat];
        const hasQuantity = categoryQuantities[cat] && categoryQuantities[cat] > 0;
        return hasItem && hasQuantity;
      });
    }
    if (step === 3) return !!selectedDate && !!timeSlot;
    if (step === 4) return !!pickupLocation && locationAvailable;
    if (step === 5) return true;
    if (step === 6) return paid; // allow continue once paid
    return true;
  };

  const next = () => setStep(s => Math.min(steps.length, s + 1));
  const prev = () => setStep(s => Math.max(1, s - 1));

  const scheduleOrder = async () => {
    setSubmitting(true);
    try {
      const payload = {
        category,
        items: item,
        quantity: Number(quantity),
        date: selectedDate,
        timeSlot,
        location: pickupLocation,
        instructions
      // Create items and quantities strings for multiple categories
      const itemsList = selectedCategories.map(cat => {
        const item = categoryItems[cat];
        const quantity = categoryQuantities[cat];
        return `${cat}: ${item} (${quantity}kg)`;
      }).join('; ');

      const totalQuantity = selectedCategories.reduce((total, cat) => {
        return total + (categoryQuantities[cat] || 0);
      }, 0);

      const payload = {
        category: selectedCategories.join(', '), // Join multiple categories
        items: itemsList,
        quantity: totalQuantity,
        date: selectedDate,
        timeSlot,
        location: pickupLocation,
        coordinates: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || 'User selected location'
        } : null,
        instructions,
        paymentMethod: paymentMethod // Include the selected payment method
      };
      const res = await scApi.schedule(payload);
      setScheduled(res);
      next(); // move to payment
    } catch (e) {
      alert(e?.response?.data || 'Failed to schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const pay = async () => {
    if (!scheduled?.collectionId) return alert('Please schedule first');
    try {
      if (paymentMethod === 'cash') {
        await scApi.payWithMethod(scheduled.collectionId, 'cash', true);
      } else if (paymentMethod === 'bank') {
        await scApi.payWithMethod(scheduled.collectionId, 'bank', true);
      } else {
        await scApi.payWithMethod(scheduled.collectionId, 'card', true);
      }
      setPaid(true);
      next(); // go to confirmation
      // navigate back to manage after short delay to show updated status
      setTimeout(() => navigate('/special/manage'), 800);
    } catch (e) {
      alert('Payment failed');
    }
  };

  const openPayment = () => {
    if (!scheduled?.collectionId) return alert('Please schedule first');
    setShowPaymentModal(true);
  };

  const validateAndPay = async () => {
    setIsPaying(true);
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExp || !cardCvv) {
        alert('Please enter card number, expiry date, and CVV');
        setIsPaying(false);
        return;
      }
      if (cardNumber.replace(/\s|-/g, '').length < 12) {
        alert('Card number looks invalid');
        setIsPaying(false);
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(cardExp)) {
        alert('Expiry should be MM/YY');
        setIsPaying(false);
        return;
      }
      if (cardCvv.length < 3) {
        alert('CVV looks invalid');
        setIsPaying(false);
        return;
      }
    }
    if (paymentMethod === 'bank') {
      if (!bankSlip) {
        alert('Please upload the bank transfer slip');
        setIsPaying(false);
        return;
      }
    }
    // cash: no extra validation
    try {
      await pay();
      setShowPaymentModal(false);
    } finally {
      setIsPaying(false);
    }
  };

  const Summary = () => (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-1 border-b border-gray-100">
          <span className="text-gray-600">Category</span>
          <span className="font-medium">{category || '-'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-gray-100">
          <span className="text-gray-600">Item</span>
          <span className="font-medium">{item || (category === 'Other' && otherDesc ? otherDesc : '-')}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-gray-100">
          <span className="text-gray-600">Quantity</span>
          <span className="font-medium">{Number(quantity) > 0 ? quantity : 0}</span>
            <span className="text-gray-600">Categories</span>
            <span className="font-medium">{selectedCategories.length > 0 ? selectedCategories.join(', ') : '-'}</span>
          </div>
          <div className="py-1 border-b border-gray-100">
            <span className="text-gray-600 block mb-2">Items & Quantities:</span>
            <div className="space-y-1">
              {selectedCategories.map(cat => {
                const item = categoryItems[cat];
                const quantity = categoryQuantities[cat];
                return (
                  <div key={cat} className="text-sm">
                    <span className="font-medium text-gray-800">{cat}:</span> {item} ({quantity}kg)
                  </div>
                );
              })}
        </div>
        </div>
        <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">Total Quantity</span>
            <span className="font-medium">
              {selectedCategories.reduce((total, cat) => total + (categoryQuantities[cat] || 0), 0)} kg
            </span>
        </div>
        <div className="flex justify-between py-1 border-b border-gray-100">
          <span className="text-gray-600">Date</span>
          <span className="font-medium">{selectedDate || '-'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-gray-100">
          <span className="text-gray-600">Time</span>
          <span className="font-medium">{timeSlot || '-'}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-gray-100">
          <span className="text-gray-600">Pickup</span>
          <span className="font-medium">{pickupLocation || '-'}</span>
        </div>
        {!!instructions && (
          <div className="py-1">
            <span className="block text-gray-600 mb-1">Instructions</span>
            <div className="text-gray-800 text-xs bg-gray-50 rounded p-2">{instructions}</div>
          </div>
        )}
        <div className="flex justify-between py-2 mt-2">
          <span className="text-gray-600">Estimated Fee</span>
          <span className="font-semibold">LKR {(fee || 0).toFixed(2)}</span>
        </div>
        {scheduled?.fee != null && (
          <div className="flex justify-between py-2 border-t border-gray-200">
            <span className="text-gray-600">Scheduled Fee</span>
            <span className="font-semibold">LKR {Number(scheduled.fee).toFixed(2)}</span>
          </div>
        )}
        {scheduled?.collectionId && (
          <div className="text-xs text-gray-500">ID: {scheduled.collectionId}</div>
        )}
      </div>
    </div>
  );

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Main Content only (left sidebar removed) */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-8">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {steps.map((s) => (
                  <div key={s.id} className="flex-1 text-center">
                    <div className={`text-xs font-medium ${step >= s.id ? 'text-green-500' : 'text-gray-400'}`}>
                      {s.name}
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${(step / steps.length) * 100}%` }} />
              </div>
            </div>

            {/* Info Cards moved to bottom outside container */}

            <div className="min-h-96">
              {/* Global scheduling loader overlay */}
              {submitting && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
                  <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-green-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span className="text-sm text-gray-700">Scheduling your collection...</span>
                  </div>
                </div>
              )}
              {/* Step 1: Category */}
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold mb-2">Select Waste Category</h2>
                  <p className="text-gray-600 mb-6">Choose the type of special waste you want to schedule</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map(c => (
                      <button key={c.key} onClick={() => setCategory(c.key)} className={`border rounded-lg p-4 text-left hover:shadow transition ${category === c.key ? 'border-green-600' : 'border-gray-300'}`}>
                        <div className="w-full h-24 bg-gray-100 rounded mb-3 flex items-center justify-center text-gray-400 text-sm">
                          {c.img ? <img src={c.img} alt={c.key} className="max-h-20" /> : c.key}
                  <h2 className="text-2xl font-bold mb-2">Select Waste Categories</h2>
                  <p className="text-gray-600 mb-6">Choose one or more types of special waste you want to schedule</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map(c => (
                      <button 
                        key={c.key} 
                        onClick={() => handleMultiCategorySelect(c.key)} 
                        className={`border rounded-lg p-4 text-left hover:shadow transition-all duration-200 ${
                          selectedCategories.includes(c.key) 
                            ? 'border-green-600 bg-green-50 shadow-md' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        <div className="w-full h-24 bg-gray-100 rounded mb-3 flex items-center justify-center text-gray-400 text-sm relative overflow-hidden">
                          {c.img ? <img src={c.img} alt={c.key} className="w-full h-full object-cover rounded" /> : c.key}
                          {selectedCategories.includes(c.key) && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="font-semibold">{c.key}</div>
                        <div className="text-xs text-gray-500 mt-1">{c.items.length ? c.items.slice(0,3).join(', ') : 'Describe in next step'}</div>
                      </button>
                    ))}
                  </div>
                  {selectedCategories.length > 0 && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">Selected Categories ({selectedCategories.length})</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCategories.map(cat => (
                          <span key={cat} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Items/Quantity */}
              {step === 2 && (
                <div className="max-w-lg">
                  <h2 className="text-2xl font-bold mb-2">Items and Quantity</h2>
                  <p className="text-gray-600 mb-6">Specify item and total weight</p>
                  {category !== 'Other' ? (
                    <div className="flex gap-3">
                      <select value={item} onChange={e => setItem(e.target.value)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                <div className="max-w-4xl">
                  <h2 className="text-2xl font-bold mb-2">Items and Quantity</h2>
                  <p className="text-gray-600 mb-6">Specify items and total weight for each selected category</p>
                  
                  <div className="space-y-6">
                    {selectedCategories.map((cat, index) => {
                      const categoryData = categories.find(c => c.key === cat);
                      const itemList = categoryData ? categoryData.items : [];
                      
                      return (
                        <div key={cat} className={`bg-white border rounded-xl p-6 ${
                          categoryItems[cat] && categoryQuantities[cat] 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-200'
                        }`}>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              categoryItems[cat] && categoryQuantities[cat] 
                                ? 'bg-green-500' 
                                : 'bg-green-100'
                            }`}>
                              {categoryItems[cat] && categoryQuantities[cat] ? (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="text-green-600 font-bold">{index + 1}</span>
                              )}
                            </div>
                            {cat}
                            {categoryItems[cat] && categoryQuantities[cat] && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                ✓ Complete
                              </span>
                            )}
                          </h3>
                          
                          {cat !== 'Other' ? (
                    <div className="flex gap-3">
                              <select 
                                value={categoryItems[cat] || ''} 
                                onChange={e => handleCategoryItemChange(cat, e.target.value)} 
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                <option value="">Select item</option>
                        {itemList.map(it => (
                          <option key={it} value={it}>{it}</option>
                        ))}
                      </select>
                      <input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} className="w-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Quantity (kg)" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input value={otherDesc} onChange={e => setOtherDesc(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Describe the item" />
                      <input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} className="w-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Quantity (kg)" />
                    </div>
                  )}
                  <div className="mt-3 text-sm text-gray-700">Estimated Fee: <span className="font-semibold">LKR {fee.toFixed(2)}</span></div>
                              <input 
                                type="number" 
                                min={1} 
                                value={categoryQuantities[cat] || ''} 
                                onChange={e => handleCategoryQuantityChange(cat, e.target.value)} 
                                className="w-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" 
                                placeholder="Weight (kg)" 
                              />
                    </div>
                  ) : (
                    <div className="space-y-3">
                              <input 
                                value={categoryItems[cat] || ''} 
                                onChange={e => handleCategoryItemChange(cat, e.target.value)} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" 
                                placeholder="Describe the item" 
                              />
                              <input 
                                type="number" 
                                min={1} 
                                value={categoryQuantities[cat] || ''} 
                                onChange={e => handleCategoryQuantityChange(cat, e.target.value)} 
                                className="w-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" 
                                placeholder="Weight (kg)" 
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <span className="font-semibold">Total Estimated Fee:</span> 
                      <span className="ml-2 text-lg font-bold">LKR {fee.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 text-sm text-blue-700">
                      <span className="font-medium">Total Weight:</span> 
                      <span className="ml-2">
                        {selectedCategories.reduce((total, cat) => total + (categoryQuantities[cat] || 0), 0)} kg
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Fee calculated based on selected categories and individual weights
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Calendar & Time */}
              {step === 3 && (
                <div className="max-w-lg">
                  <h2 className="text-2xl font-bold mb-2">Choose Date and Time</h2>
                  <p className="text-gray-600 mb-6">Pick a date (next 14 days) and available slot</p>
                  <div className="flex gap-3">
                    <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">-- choose date --</option>
                      {dates.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">-- choose slot --</option>
                      {slots.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 4: Pickup Location */}
              {step === 4 && (
                <div className="max-w-lg">
                  <h2 className="text-2xl font-bold mb-2">Pickup Location</h2>
                  <p className="text-gray-600 mb-6">Where should we collect your special waste?</p>
                <div className="max-w-4xl">
                  <h2 className="text-2xl font-bold mb-2">Pickup Location</h2>
                  <p className="text-gray-600 mb-6">Where should we collect your special waste?</p>
                  
                  <div className="space-y-6">
                    {/* Location Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location Type</label>
                  <select value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <textarea className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Special instructions (optional)" value={instructions} onChange={e => setInstructions(e.target.value)} rows={4} />
                    </div>

                    {/* Location Selection Methods */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Current Location */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Use Current Location
                        </h4>
                        <button
                          onClick={requestGeolocation}
                          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Get My Location
                        </button>
                        {locationError && (
                          <p className="text-red-600 text-sm mt-2">Location access denied or unavailable</p>
                        )}
                        {locationAvailable && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 text-sm">✓ Location captured successfully</p>
                            <p className="text-green-700 text-xs">Lat: {location?.latitude?.toFixed(6)}, Lng: {location?.longitude?.toFixed(6)}</p>
                          </div>
                        )}
                      </div>

                      {/* Search Location */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Search Location
                        </h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={locationSearchQuery}
                            onChange={e => setLocationSearchQuery(e.target.value)}
                            placeholder="Enter address or landmark"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            onClick={handleLocationSearch}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Search Location
                          </button>
                        </div>
                        {customLocationSet && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 text-sm">✓ Location found</p>
                            <p className="text-green-700 text-xs">{customLocation?.address}</p>
                            <button
                              onClick={useCustomLocation}
                              className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Use This Location
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interactive Map for Location Selection */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium mb-2">Or Click on Map to Set Location</h5>
                      <div className="relative">
                        <iframe
                          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBuKrghtMt7e6xdr3TLiGhVZNuqTFTgMXk&q=Colombo,Sri+Lanka&zoom=12&maptype=roadmap`}
                          width="100%"
                          height="300"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="rounded-lg"
                          title="Location Picker Map"
                        />
                        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow-sm text-xs text-gray-600">
                          Click to set location
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Click anywhere on the map to set your pickup location
                      </p>
                    </div>

                    {/* Location Preview */}
                    {locationAvailable && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Your Location on Map
                        </h4>
                        <div className="relative">
                          <iframe
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBuKrghtMt7e6xdr3TLiGhVZNuqTFTgMXk&q=${location?.latitude},${location?.longitude}&zoom=15&maptype=roadmap`}
                            width="100%"
                            height="300"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="rounded-lg"
                            title="User Location Map"
                          />
                          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow-sm text-xs text-gray-600">
                            📍 Your Location
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          This map shows your pickup location for scheduling
                        </p>
                      </div>
                    )}

                    {/* Instructions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions (Optional)</label>
                      <textarea 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" 
                        placeholder="Any special instructions for pickup..." 
                        value={instructions} 
                        onChange={e => setInstructions(e.target.value)} 
                        rows={4} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Order Summary (inline actions) */}
              {step === 5 && (
                <div className="max-w-xl">
                  <h2 className="text-2xl font-bold mb-2">Order Summary</h2>
                  <p className="text-gray-600 mb-6">Review details before scheduling</p>
                  <Summary />
                  <p className="text-gray-600 mb-6">Review details and select payment method before scheduling</p>
                  <Summary />
                  
                  {/* Payment Method Selection */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Select Payment Method</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setPaymentMethod('card')} 
                        className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                          paymentMethod === 'card' 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">💳</div>
                          <div className="font-medium">Card</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('bank')} 
                        className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                          paymentMethod === 'bank' 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">🏦</div>
                          <div className="font-medium">Bank Transfer</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('cash')} 
                        className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                          paymentMethod === 'cash' 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">💵</div>
                          <div className="font-medium">Cash</div>
                        </div>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      {paymentMethod === 'cash' 
                        ? 'Payment will be collected during pickup' 
                        : paymentMethod === 'bank' 
                        ? 'You will receive bank transfer details after scheduling'
                        : 'You will be redirected to payment after scheduling'
                      }
                    </p>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600">You can go back to update details. The summary on the right updates live.</div>
                </div>
              )}

              {/* Step 6: Payment */}
              {step === 6 && (
                <div className="max-w-lg">
                  <h2 className="text-2xl font-bold mb-2">Payment</h2>
                  <p className="text-gray-600 mb-6">Complete payment to confirm your booking</p>
                  {!scheduled?.collectionId && (
                    <button onClick={scheduleOrder} disabled={submitting} className={`px-6 py-3 rounded-lg text-white ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} `}>
                      {submitting ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                          Scheduling...
                        </span>
                      ) : 'Schedule & Proceed to Pay'}
                    </button>
                  )}
                  {scheduled?.collectionId && !paid && (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700">Collection ID: <span className="font-mono">{scheduled.collectionId}</span></div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Choose a payment method</p>
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => setPaymentMethod('card')} className={`px-3 py-2 rounded border ${paymentMethod === 'card' ? 'border-green-600 text-green-700' : 'border-gray-300 text-gray-700'}`}>Card</button>
                          <button onClick={() => setPaymentMethod('bank')} className={`px-3 py-2 rounded border ${paymentMethod === 'bank' ? 'border-green-600 text-green-700' : 'border-gray-300 text-gray-700'}`}>Bank Transfer</button>
                          <button onClick={() => setPaymentMethod('cash')} className={`px-3 py-2 rounded border ${paymentMethod === 'cash' ? 'border-green-600 text-green-700' : 'border-gray-300 text-gray-700'}`}>Cash</button>
                        </div>
                      </div>
                  {scheduled?.collectionId && !paid && (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700">Collection ID: <span className="font-mono">{scheduled.collectionId}</span></div>
                      <div className="text-sm text-gray-700">Payment Method: <span className="font-medium capitalize">{paymentMethod}</span></div>
                      <button onClick={openPayment} className="px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700">Proceed to Pay LKR {Number(scheduled.fee ?? fee).toFixed(2)}</button>
                    </div>
                  )}
                  {paid && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">Payment processed. A confirmation email has been sent.</div>
                  )}
                </div>
              )}

              {/* Step 7: Confirmation */}
              {step === 7 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Booking Confirmed</h2>
                  <p className="text-gray-600 mb-6">Your special collection has been scheduled successfully.</p>
                  <div className="max-w-md mx-auto space-y-4">
                    <Summary />
                    {scheduled?.collectionId && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await scApi.downloadReceipt(scheduled.collectionId);
                            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/plain' }));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `receipt-${scheduled.collectionId}.txt`);
                            document.body.appendChild(link);
                            link.click();
                            link.parentNode.removeChild(link);
                          } catch (err) {
                            alert('Failed to download receipt');
                          }
                        }}
                        className="px-6 py-3 rounded-lg text-white bg-green-600 hover:bg-green-700"
                      >
                        Download Receipt
                      </button>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {scheduled?.collectionId && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await scApi.downloadReceipt(scheduled.collectionId);
                              const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/plain' }));
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', `receipt-${scheduled.collectionId}.txt`);
                              document.body.appendChild(link);
                              link.click();
                              link.parentNode.removeChild(link);
                            } catch (err) {
                              alert('Failed to download receipt');
                            }
                          }}
                          className="flex-1 px-6 py-3 rounded-lg text-white bg-green-600 hover:bg-green-700 transition duration-200"
                        >
                          Download Receipt
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/special/manage')}
                        className="flex-1 px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition duration-200"
                      >
                        Manage Collections
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            {step < steps.length && (
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button onClick={prev} disabled={step === 1} className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Previous
                </button>
                <button onClick={step === 5 ? scheduleOrder : next} disabled={submitting || hasUnpaid || !canNext() || (step === 6 && !paid)} className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {step === 5 ? 'Schedule' : step === 6 ? 'Next' : 'Next'}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar (visible on all steps) */}
          <div className="w-80">
            {hasUnpaid && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
                You have an unpaid special collection. Please pay it before scheduling a new one.
              </div>
            )}
            <Summary />
          </div>
        </div>
      </div>
    </div>
    {/* Bottom Info Cards outside main container */}
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg p-5 bg-blue-50 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
            <p className="text-sm text-blue-800">Choose category, set items and weight (kg), pick a date and time, and confirm payment. You will receive email confirmations.</p>
          </div>
          <div className="rounded-lg p-5 bg-orange-50 border border-orange-100">
            <h3 className="font-semibold text-orange-900 mb-2">Pickup schedules</h3>
            <p className="text-sm text-orange-800">Weekdays: Morning 9.30–12.00, Afternoon 3.00–6.00. Weekends: Morning 10.00–11.30, Afternoon 4.00–6.00.</p>
          </div>
          <div className="rounded-lg p-5 bg-green-50 border border-green-100">
            <h3 className="font-semibold text-green-900 mb-2">Eco Benefits</h3>
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How it works
            </h3>
            <p className="text-sm text-blue-800">Choose category, set items and weight (kg), pick a date and time, and confirm payment. You will receive email confirmations.</p>
          </div>
          <div className="rounded-lg p-5 bg-orange-50 border border-orange-100">
            <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pickup schedules
            </h3>
            <p className="text-sm text-orange-800">Weekdays: Morning 9.30–12.00, Afternoon 3.00–6.00. Weekends: Morning 10.00–11.30, Afternoon 4.00–6.00.</p>
          </div>
          <div className="rounded-lg p-5 bg-green-50 border border-green-100">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Eco Benefits
            </h3>
            <p className="text-sm text-green-800">Proper disposal reduces pollution and supports recycling. Thank you for helping keep our city clean.</p>
          </div>
        </div>
      </div>
    </div>
    {/* Payment Modal */}
    {showPaymentModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Payment - {paymentMethod === 'card' ? 'Card' : paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash'}</h3>
            <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Card Number</label>
                <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Expiry (MM/YY)</label>
                  <input value={cardExp} onChange={e => setCardExp(e.target.value)} placeholder="MM/YY" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium mb-1">CVV</label>
                  <input value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="123" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="text-sm text-gray-600">Amount: <span className="font-semibold">LKR {Number(scheduled?.fee ?? fee).toFixed(2)}</span></div>
            </div>
          )}

          {paymentMethod === 'bank' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-700">Transfer to:</div>
                <div className="mt-2 text-sm">
                  <div><span className="text-gray-600">Bank:</span> Eco National Bank</div>
                  <div><span className="text-gray-600">Account Name:</span> EcoWaste Solutions</div>
                  <div><span className="text-gray-600">Account No:</span> 123456789</div>
                  <div><span className="text-gray-600">Branch:</span> City Center</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Upload Transfer Slip (PNG/JPG/PDF)</label>
                <input type="file" accept="image/*,.pdf" onChange={e => setBankSlip(e.target.files?.[0] || null)} />
              </div>
              <div className="text-sm text-gray-600">Amount: <span className="font-semibold">LKR {Number(scheduled?.fee ?? fee).toFixed(2)}</span></div>
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
                Please have the exact amount ready at pickup. Our staff will provide a receipt.
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <input value={cashNotes} onChange={e => setCashNotes(e.target.value)} placeholder="e.g., please bring change" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="text-sm text-gray-600">Amount: <span className="font-semibold">LKR {Number(scheduled?.fee ?? fee).toFixed(2)}</span></div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => !isPaying && setShowPaymentModal(false)} className={`px-5 py-2 border border-gray-300 rounded-lg ${isPaying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>Cancel</button>
            <button onClick={validateAndPay} disabled={isPaying} className={`px-6 py-2 rounded-lg text-white ${isPaying ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
              {isPaying ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}


