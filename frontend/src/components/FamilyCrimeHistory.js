import React, { useEffect, useState } from 'react';
import api from '../api';

function FamilyCrimeHistory({ criminalId, onClose }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/criminal/${criminalId}/family-crime-history`)
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Family crime history error:', err);
        setError(err.message || 'Failed to load family crime history');
        setLoading(false);
      });
  }, [criminalId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 text-center">
          Loading crime history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-600">Error</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <p className="text-gray-700">Could not load family crime history: {error}</p>
          <button onClick={onClose} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Close</button>
        </div>
      </div>
    );
  }

  // If history is empty or no relations
  if (!history || Object.keys(history).length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Family Crime History</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <p className="text-gray-500 text-center py-8">No family relations found for this criminal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Family Crime History</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">✕</button>
        </div>
        <div className="p-6 space-y-6">
          {Object.entries(history).map(([relation, data]) => (
            <div key={relation} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold capitalize mb-2">{relation}</h3>
              <p className="text-sm text-gray-600">Name: {data.person?.full_name || '—'}</p>
              {data.crimes && data.crimes.length === 0 ? (
                <p className="text-green-600 mt-2">✓ This person is not involved in any criminal history.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {data.crimes?.map((crime, idx) => (
                    <div key={idx} className="border-l-4 border-red-500 pl-3 py-2 bg-gray-50 rounded">
                      <p className="font-semibold">FIR {crime.fir_number} – {crime.title}</p>
                      <p className="text-sm">Role: {crime.role}</p>
                      <p className="text-sm">Status: {crime.status}</p>
                      <p className="text-sm">Category: {crime.category}</p>
                      <p className="text-sm">Station: {crime.station_name}</p>
                      <p className="text-sm">Filed: {new Date(crime.date_filed).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FamilyCrimeHistory;