import React, { useEffect, useState } from 'react';
import scApi from '../../api/specialCollection';
import { useNavigate } from 'react-router-dom';

export default function ManageSpecial() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [dates, setDates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [qrCodes, setQrCodes] = useState({});
  const [showQRModal, setShowQRModal] = useState(null);
  const [activeTab, setActiveTab] = useState('ongoing');

  const loadData = async () => {
    scApi.listMine().then(setItems).catch(() => setItems([]));
    scApi.getDates().then(setDates).catch(() => setDates([]));
  };

  // Filter collections based on status
  const ongoingCollections = items.filter(item => 
    item.status?.toLowerCase() !== 'collected' && 
    item.status?.toLowerCase() !== 'completed' &&
    item.status?.toLowerCase() !== 'cancelled'
  );

  const collectedCollections = items.filter(item => 
    item.status?.toLowerCase() === 'collected' || 
    item.status?.toLowerCase() === 'completed'
  );

  const cancelledCollections = items.filter(item => 
    item.status?.toLowerCase() === 'cancelled'
  );

  useEffect(() => {
    loadData();
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    if (date) {
      scApi.getSlots(date).then(setSlots).catch(() => setSlots([]));
    } else {
      setSlots([]);
    }
  }, [date]);

  const reschedule = async () => {
    if (!selected) return;
    try {
    
    // Check if rescheduling is allowed (more than 24 hours before scheduled time)
    try {
      const scheduledDate = new Date(selected.date);
      const now = new Date();
      const timeDiff = scheduledDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      
      if (hoursDiff <= 24) {
        alert('Rescheduling is only allowed more than 24 hours before the scheduled time. Please schedule a new collection instead.');
        return;
      }
      
      await scApi.reschedule(selected.id, { date, timeSlot });
      alert('Rescheduled');
      const refreshed = await scApi.listMine();
      setItems(refreshed);
      setSelected(null);
      setDate('');
      setTimeSlot('');
    } catch (e) {
      alert(e?.response?.data || 'Failed to reschedule');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Manage Special Collections</h2>
          <button onClick={loadData} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">Refresh</button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {items.map(it => (
            <div key={it.id} className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">ID</span>
                    <span className="font-mono text-sm">{it.id}</span>
                  </div>
                  <div className="font-semibold">{it.category} — {it.items}</div>
                  <div className="text-sm text-gray-600">Qty: {it.quantity} kg</div>
                  <div className="text-sm text-gray-600">{it.date} — {it.timeSlot}</div>
                  <div className="text-sm text-gray-600">Pickup: {it.location}</div>
                  <div className="mt-2 text-sm"><span className="text-gray-600">Status:</span> <span className="font-medium">{it.status}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Payment:</span> <span className={`font-medium ${String(it.paymentStatus).toLowerCase()==='paid'?'text-green-600':String(it.paymentStatus).toLowerCase()==='pending'?'text-yellow-600':'text-red-600'}`}>{it.paymentStatus}</span></div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {String(it.paymentStatus).toLowerCase() === 'unpaid' && (
                    <button
                      onClick={() => navigate('/special/schedule', { state: { payFor: it } })}
                      className="px-3 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Pay Now
                    </button>
                  )}
                  <button onClick={() => setSelected(it)} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100">Reschedule</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)}></div>
            <div className="relative max-w-lg mx-auto mt-24 bg-white rounded-lg shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Reschedule #{selected.id}</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div className="space-y-3">
                <select value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">-- choose date --</option>
  const cancelCollection = async (collection) => {
    if (!window.confirm(`Are you sure you want to cancel and permanently delete collection #${collection.id}?\n\nThis action cannot be undone and the collection will be removed from the database.`)) return;
    
    try {
      // const response = await scApi.cancel(collection.id);
      alert('Collection cancelled and deleted successfully');
      const refreshed = await scApi.listMine();
      setItems(refreshed);
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to cancel collection');
    }
  };

  const generateQRCode = async (collectionId) => {
    try {
      console.log('Generating QR code for collection:', collectionId);
      const response = await fetch(`http://localhost:8081/api/special-collection/qr-base64/${collectionId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('QR code response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('QR code data received:', data);
        setQrCodes(prev => ({ ...prev, [collectionId]: data.qrCode }));
        return data.qrCode;
      } else {
        const errorText = await response.text();
        console.error('QR code generation failed:', response.status, errorText);
        throw new Error(`Failed to generate QR code: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert(`Failed to generate QR code: ${error.message}`);
      return null;
    }
  };

  const downloadQRCode = async (collectionId) => {
    try {
      console.log('Downloading QR code for collection:', collectionId);
      const response = await fetch(`http://localhost:8081/api/special-collection/qr/${collectionId}`, {
        credentials: 'include',
      });
      
      console.log('Download QR code response status:', response.status);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${collectionId}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('QR code downloaded successfully');
      } else {
        const errorText = await response.text();
        console.error('Download QR code failed:', response.status, errorText);
        throw new Error(`Failed to download QR code: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert(`Failed to download QR code: ${error.message}`);
    }
  };

  const showQRCode = async (collectionId) => {
    let qrCode = qrCodes[collectionId];
    if (!qrCode) {
      qrCode = await generateQRCode(collectionId);
    }
    if (qrCode) {
      setShowQRModal(collectionId);
    }
  };

  // Helper function to render collection cards
  const renderCollectionCard = (it) => {
    const scheduledDate = new Date(it.date);
    const now = new Date();
    const timeDiff = scheduledDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    const canReschedule = hoursDiff > 24;
    const canCancel = hoursDiff > 8;
    
    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
        case 'collected': return 'bg-green-100 text-green-800 border-green-200';
        case 'completed': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getPaymentColor = (paymentStatus) => {
      switch (paymentStatus?.toLowerCase()) {
        case 'paid': return 'bg-green-100 text-green-800 border-green-200';
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'unpaid': return 'bg-red-100 text-red-800 border-red-200';
        case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <div key={it.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className={`p-4 ${
          it.status?.toLowerCase() === 'collected' 
            ? 'bg-green-600' 
            : 'bg-blue-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-mono text-sm">#{it.id}</span>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(it.status)}`}>
              {it.status}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category & Items */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{it.category}</h3>
            <p className="text-gray-600 text-sm mb-2">{it.items}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{it.quantity} kg</span>
              <span>{it.timeSlot}</span>
            </div>
          </div>

          {/* Date & Location */}
          <div className="mb-4 space-y-1">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Date: </span>{it.date}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Location: </span>{it.location}
            </div>
            {/* Show completion timestamp for collected collections */}
            {it.status?.toLowerCase() === 'collected' && it.collectedAt && (
              <div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                <span className="font-medium">Completed: {new Date(it.collectedAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Payment Status */}
          <div className="mb-4">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPaymentColor(it.paymentStatus)}`}>
              {it.paymentStatus}
            </div>
            {it.fee && (
              <div className="mt-1 text-sm font-semibold text-gray-900">
                LKR {Number(it.fee).toFixed(2)}
              </div>
            )}
          </div>

          {/* QR Code Section - Only show for scheduled collections */}
          {it.status?.toLowerCase() === 'scheduled' && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-800">Collection QR Code</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => showQRCode(it.id)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-200 text-xs"
                  >
                    View
                  </button>
                  <button
                    onClick={() => downloadQRCode(it.id)}
                    className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition duration-200 text-xs"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Show only "Collected" button if status is collected */}
            {it.status?.toLowerCase() === 'collected' ? (
              <button
                disabled
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded cursor-not-allowed opacity-75 text-sm font-medium"
              >
                ✓ Collected
              </button>
            ) : (
              <>
                {String(it.paymentStatus).toLowerCase() === 'unpaid' && (
                  <button
                    onClick={() => navigate('/special/schedule', { state: { payFor: it } })}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 text-sm"
                  >
                    Pay Now
                  </button>
                )}
                
                {canReschedule && (
                  <button 
                    onClick={() => setSelected(it)} 
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200 text-sm"
                  >
                    Reschedule
                  </button>
                )}
                
                {canCancel && it.status?.toLowerCase() !== 'cancelled' && (
                  <button
                    onClick={() => cancelCollection(it)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200 text-sm"
                    title="Cancel and permanently delete this collection"
                  >
                    Cancel & Delete
                  </button>
                )}
                
                {!canReschedule && !canCancel && (
                  <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-500 rounded text-sm text-center">
                    {hoursDiff <= 8 ? 'Too late to modify' : 'Cannot modify'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Manage Special Collections
              </h1>
              <p className="text-gray-600">Track and manage your scheduled waste collections</p>
            </div>
            <button 
              onClick={loadData} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
                activeTab === 'ongoing'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ongoing ({ongoingCollections.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('collected')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
                activeTab === 'collected'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Collected ({collectedCollections.length})
              </div>
            </button>
            {cancelledCollections.length > 0 && (
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
                  activeTab === 'cancelled'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelled ({cancelledCollections.length})
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeTab === 'ongoing' && ongoingCollections.map(renderCollectionCard)}
          {activeTab === 'collected' && collectedCollections.map(renderCollectionCard)}
          {activeTab === 'cancelled' && cancelledCollections.map(renderCollectionCard)}
        </div>

        {/* Empty States */}
        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Collections Yet</h3>
            <p className="text-gray-600 mb-4">You haven't scheduled any special waste collections yet.</p>
            <button
              onClick={() => navigate('/special/schedule')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
            >
              Schedule Your First Collection
            </button>
          </div>
        )}

        {/* Empty State for Ongoing Collections */}
        {activeTab === 'ongoing' && ongoingCollections.length === 0 && items.length > 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Ongoing Collections</h3>
            <p className="text-gray-600 mb-4">All your collections have been completed or cancelled.</p>
            <button
              onClick={() => navigate('/special/schedule')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
            >
              Schedule New Collection
            </button>
          </div>
        )}

        {/* Empty State for Collected Collections */}
        {activeTab === 'collected' && collectedCollections.length === 0 && items.length > 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Collected Collections</h3>
            <p className="text-gray-600">You haven't completed any collections yet.</p>
          </div>
        )}

        {/* Empty State for Cancelled Collections */}
        {activeTab === 'cancelled' && cancelledCollections.length === 0 && items.length > 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cancelled Collections</h3>
            <p className="text-gray-600">You haven't cancelled any collections.</p>
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-md w-full transform transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Reschedule Collection</h3>
                  <p className="text-gray-600 text-sm">#{selected.id}</p>
                </div>
                <button 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full" 
                  onClick={() => setSelected(null)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select New Date</label>
                  <select 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Choose a date</option>
                  {dates.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">-- choose slot --</option>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot</label>
                  <select 
                    value={timeSlot} 
                    onChange={e => setTimeSlot(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Choose a time slot</option>
                  {slots.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button onClick={reschedule} disabled={!date || !timeSlot} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">Confirm</button>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setSelected(null)} 
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={reschedule} 
                  disabled={!date || !timeSlot} 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  Confirm Reschedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowQRModal(null)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-md w-full transform transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Collection QR Code</h3>
                  <p className="text-gray-600 text-sm">#{showQRModal}</p>
                </div>
                <button 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full" 
                  onClick={() => setShowQRModal(null)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center">
                {qrCodes[showQRModal] ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <img 
                        src={`data:image/png;base64,${qrCodes[showQRModal]}`} 
                        alt="QR Code" 
                        className="w-48 h-48 border-2 border-gray-200 rounded-xl"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Show this QR code to the collector to mark your collection as completed
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => downloadQRCode(showQRModal)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-sm font-medium"
                      >
                        📥 Download
                      </button>
                      <button
                        onClick={() => setShowQRModal(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 text-sm font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating QR code...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


