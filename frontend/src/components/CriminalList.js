import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Eye, User, Trash2, Users, Lock, Edit, Search } from 'lucide-react';
import api from '../api';

function CriminalList() {
  const queryClient = useQueryClient();
  const role = localStorage.getItem('role');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all criminals
  const { data: criminals, isLoading: allLoading, error: allError } = useQuery({
    queryKey: ['criminals'],
    queryFn: () => api.get('/api/criminals'),
  });

  // Fetch arrested criminals
  const { data: arrestedCriminals, isLoading: arrestedLoading, error: arrestedError } = useQuery({
    queryKey: ['arrestedCriminals'],
    queryFn: () => api.get('/api/criminals/arrested'),
  });

  const deleteMutation = useMutation({
    mutationFn: (criminalId) => api.delete(`/api/criminal/${criminalId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['criminals']);
      queryClient.invalidateQueries(['arrestedCriminals']);
    },
  });

  const handleDelete = (criminalId, name) => {
    if (window.confirm(`Delete criminal ${name}?`)) {
      deleteMutation.mutate(criminalId);
    }
  };

  const isLoading = activeTab === 'all' ? allLoading : arrestedLoading;
  const error = activeTab === 'all' ? allError : arrestedError;
  let data = activeTab === 'all' ? criminals : arrestedCriminals;

  // Apply search filter
  let filteredData = data || [];
  const searchLower = searchTerm.trim().toLowerCase();
  filteredData = filteredData.filter(criminal =>
    criminal.full_name.toLowerCase().includes(searchLower) ||
    (criminal.cnic && criminal.cnic.toLowerCase().includes(searchLower))
  );

  if (isLoading) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>
      ))}
    </div>
  );
  if (error) return <div className="p-6 text-red-500">Error loading criminals</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Criminals</h1>
        {role === 'Officer' && (
          <Link to="/create-criminal" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            + Create Criminal
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'all'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" /> All Criminals
          </button>
          <button
            onClick={() => setActiveTab('arrested')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'arrested'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-1" /> In Custody
          </button>
        </div>
      </div>

      {/* Search bar (only filter) */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or CNIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Criminal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">
            No criminals found matching your search.
          </div>
        ) : (
          filteredData.map(criminal => (
            <motion.div
              key={criminal.criminal_id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              {criminal.photo_url ? (
                <img
                  src={`https://fir-management-system.onrender.com${criminal.photo_url}`}
                  alt={criminal.full_name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-lg">{criminal.full_name}</h3>
                {criminal.alias && <p className="text-gray-600">Alias: {criminal.alias}</p>}
                <p className="text-gray-500 text-sm mt-1">CNIC: {criminal.cnic}</p>
                <p className="text-gray-500 text-sm mt-2 truncate">{criminal.address}</p>
                {activeTab === 'arrested' && (
                  <div className="mt-2">
                    <p className="text-xs text-red-600">
                      Arrested in FIR #{criminal.fir_number} – {criminal.fir_title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Police Station: {criminal.station_name}
                    </p>
                    <p className="text-xs text-gray-500">Case status: {criminal.fir_status}</p>
                  </div>
                )}
                <div className="mt-4 flex justify-between items-center">
                  <Link
                    to={`/criminal/${criminal.criminal_id}/relations`}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" /> View Relations
                  </Link>
                  <div className="flex gap-2">
                    {role === 'Officer' && (
                      <>
                        <Link
                          to={`/update-criminal/${criminal.criminal_id}`}
                          className="text-green-600 hover:text-green-800 flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(criminal.criminal_id, criminal.full_name)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default CriminalList;
