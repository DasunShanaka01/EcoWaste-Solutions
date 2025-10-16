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
    try {
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
                  {dates.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">-- choose slot --</option>
                  {slots.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => setSelected(null)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button onClick={reschedule} disabled={!date || !timeSlot} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


