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

  const loadData = async () => {
    scApi.listMine().then(setItems).catch(() => setItems([]));
    scApi.getDates().then(setDates).catch(() => setDates([]));
  };

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

  const cancelCollection = async (collection) => {
    if (!window.confirm(`Are you sure you want to cancel and permanently delete collection #${collection.id}?\n\nThis action cannot be undone and the collection will be removed from the database.`)) return;
    
    try {
      const response = await scApi.cancel(collection.id);
      alert('Collection cancelled and deleted successfully');
      const refreshed = await scApi.listMine();
      setItems(refreshed);
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to cancel collection');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Manage Special Collections
              </h1>
              <p className="text-gray-600 text-lg">Track and manage your scheduled waste collections</p>
            </div>
            <button 
              onClick={loadData} 
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map(it => {
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
              <div key={it.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                      <span className="font-mono text-sm opacity-90">#{it.id}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(it.status)}`}>
                      {it.status}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Category & Items */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{it.category}</h3>
                    <p className="text-gray-600 text-sm">{it.items}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {it.quantity} kg
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {it.timeSlot}
                      </span>
                    </div>
                  </div>

                  {/* Date & Location */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{it.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{it.location}</span>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="mb-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getPaymentColor(it.paymentStatus)}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      {it.paymentStatus}
                    </div>
                    {it.fee && (
                      <div className="mt-2 text-lg font-bold text-gray-800">
                        LKR {Number(it.fee).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                  {String(it.paymentStatus).toLowerCase() === 'unpaid' && (
                    <button
                      onClick={() => navigate('/special/schedule', { state: { payFor: it } })}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm font-medium"
                      >
                        💳 Pay Now
                      </button>
                    )}
                    
                    {canReschedule && (
                      <button 
                        onClick={() => setSelected(it)} 
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 text-sm font-medium"
                      >
                        📅 Reschedule
                      </button>
                    )}
                    
                    {canCancel && it.status?.toLowerCase() !== 'cancelled' && (
                      <button
                        onClick={() => cancelCollection(it)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 text-sm font-medium"
                        title="Cancel and permanently delete this collection"
                      >
                        🗑️ Cancel & Delete
                    </button>
                  )}
                    
                    {!canReschedule && !canCancel && (
                      <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm text-center">
                        {hoursDiff <= 8 ? 'Too late to modify' : 'Cannot modify'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Collections Yet</h3>
            <p className="text-gray-600 mb-6">You haven't scheduled any special waste collections yet.</p>
            <button
              onClick={() => navigate('/special/schedule')}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Schedule Your First Collection
            </button>
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
      </div>
    </div>
  );
}


