import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';

function CompletedCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [criminals, setCriminals] = useState([]);

  useEffect(() => {
    api.get('/api/firs/completed')
      .then(data => {
        setCases(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const loadCriminals = async (firId) => {
    try {
      const data = await api.get(`/api/fir/${firId}/criminals`);
      setCriminals(data);
      setSelectedCase(firId);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading completed cases...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Completed Cases</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map(caseItem => (
          <motion.div
            key={caseItem.fir_id}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition"
          >
            <div className="p-4">
              <h3 className="font-bold text-lg">{caseItem.title}</h3>
              <p className="text-gray-600 text-sm">FIR Number: {caseItem.fir_number}</p>
              <p className="text-gray-600 text-sm">Citizen: {caseItem.citizen_name}</p>
              <p className="text-gray-600 text-sm">Station: {caseItem.station_name}</p>
              <p className="text-gray-500 text-sm mt-2">Completed: {new Date(caseItem.date_filed).toLocaleDateString()}</p>
              <button
                onClick={() => loadCriminals(caseItem.fir_id)}
                className="mt-3 text-blue-600 hover:underline"
              >
                View Criminals
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Criminals</h2>
              <button onClick={() => setSelectedCase(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criminals.map(criminal => (
                <div key={criminal.criminal_id} className="border rounded-lg p-3">
                  {criminal.photo_url && (
                    <img
                      src={`https://test-deploy-fir.onrender.com${criminal.photo_url}`}
                      alt={criminal.full_name}
                      className="w-16 h-16 object-cover rounded-full mb-2"
                    />
                  )}
                  <p className="font-semibold">{criminal.full_name}</p>
                  <p className="text-sm text-gray-600">Role: {criminal.role}</p>
                  {criminal.alias && <p className="text-sm">Alias: {criminal.alias}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompletedCases;
