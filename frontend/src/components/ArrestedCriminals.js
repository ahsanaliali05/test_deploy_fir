import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Eye } from 'lucide-react';
import api from '../api';

function ArrestedCriminals() {
  const [criminals, setCriminals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/criminals/arrested')
      .then(data => {
        setCriminals(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="animate-pulse h-32 bg-gray-200 rounded"></div>;

  if (criminals.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
          🔒 Criminals in Custody
        </h2>
        <p className="text-gray-500">No criminals currently in custody.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
        🔒 Criminals in Custody
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {criminals.map(criminal => (
          <div key={criminal.criminal_id} className="border rounded-lg p-3 flex items-start gap-3">
            {criminal.photo_url ? (
              <img
                src={`https://fir-management-system.onrender.com${criminal.photo_url}`}
                alt={criminal.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{criminal.full_name}</p>
                  {criminal.alias && <p className="text-xs text-gray-500">Alias: {criminal.alias}</p>}
                </div>
                <Link
                  to={`/criminal/${criminal.criminal_id}/relations`}
                  className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                >
                  <Eye className="w-4 h-4" /> View
                </Link>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Arrested in FIR <span className="font-mono">{criminal.fir_number}</span> – {criminal.fir_title}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Police Station: {criminal.station_name}
              </p>
              <p className="text-xs text-gray-500">Case status: {criminal.fir_status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArrestedCriminals;
