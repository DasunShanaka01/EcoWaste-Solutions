import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import scApi from '../../api/specialCollection';

const categories = [
  { key: 'Bulky', items: ['Sofa', 'Refrigerator', 'Mattress', 'Table', 'Chair'], img: '/bulky.png' },
  { key: 'Hazardous', items: ['Batteries', 'Paint', 'Chemicals'], img: '/hazardous.png' },
  { key: 'Organic', items: ['Leaves', 'Branches bundle', 'Kitchen waste'], img: '/organic.png' },
  { key: 'E-Waste', items: ['TV', 'Computer', 'Printer'], img: '/ewaste.png' },
  { key: 'Recyclable', items: ['Plastic', 'Paper', 'Glass', 'Metal'], img: '/recycle.png' },
  { key: 'Other', items: [], img: '/other.png' },
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
  const [fee, setFee] = useState(0);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [timeSlot, setTimeSlot] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
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
                        </div>
                        <div className="font-semibold">{c.key}</div>
                        <div className="text-xs text-gray-500 mt-1">{c.items.length ? c.items.slice(0,3).join(', ') : 'Describe in next step'}</div>
                      </button>
                    ))}
                  </div>
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
                  <select value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <textarea className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Special instructions (optional)" value={instructions} onChange={e => setInstructions(e.target.value)} rows={4} />
                </div>
              )}

              {/* Step 5: Order Summary (inline actions) */}
              {step === 5 && (
                <div className="max-w-xl">
                  <h2 className="text-2xl font-bold mb-2">Order Summary</h2>
                  <p className="text-gray-600 mb-6">Review details before scheduling</p>
                  <Summary />
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


