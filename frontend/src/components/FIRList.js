import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Eye, Search, Trash2 } from 'lucide-react';
import api from '../api';

function FIRList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedStationId, setSelectedStationId] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // new state
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [stations, setStations] = useState([]);

  // Fetch provinces
  useEffect(() => {
    api.get('/api/provinces').then(setProvinces).catch(console.error);
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    if (selectedProvinceId) {
      api.get(`/api/cities/${selectedProvinceId}`).then(setCities).catch(console.error);
    } else {
      setCities([]);
    }
    setSelectedCityId('');
    setSelectedStationId('');
  }, [selectedProvinceId]);

  // Fetch stations when city changes
  useEffect(() => {
    if (selectedCityId) {
      api.get(`/api/stations/${selectedCityId}`).then(setStations).catch(console.error);
    } else {
      setStations([]);
    }
    setSelectedStationId('');
  }, [selectedCityId]);

  // Fetch FIRs
  const { data: firs, isLoading, error } = useQuery({
    queryKey: ['firs'],
    queryFn: () => api.get('/api/firs'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (firId) => api.delete(`/api/fir/${firId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['firs']);
    },
  });

  const handleDelete = (firId) => {
    if (window.confirm('Are you sure you want to delete this FIR?')) {
      deleteMutation.mutate(firId);
    }
  };

  // Filter FIRs
  const filteredFirs = firs?.filter(fir => {
    const matchesSearch = 
      !searchTerm || 
      fir.fir_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fir.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvince = !selectedProvinceId || fir.province_id === parseInt(selectedProvinceId);
    const matchesCity = !selectedCityId || fir.city_id === parseInt(selectedCityId);
    const matchesStation = !selectedStationId || fir.station_id === parseInt(selectedStationId);
    const matchesStatus = !statusFilter || fir.status === statusFilter;

    return matchesSearch && matchesProvince && matchesCity && matchesStation && matchesStatus;
  });

  if (isLoading) return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 h-48 rounded-xl"></div>
      ))}
    </div>
  );
  if (error) return <div className="p-6 text-red-500">Error loading FIRs</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">FIRs</h1>
        {(localStorage.getItem('role') === 'Citizen' || localStorage.getItem('role') === 'Officer') && (
          <Link to="/create-fir" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            + Create New FIR
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by FIR number or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            value={selectedProvinceId}
            onChange={(e) => setSelectedProvinceId(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Provinces</option>
            {provinces.map(p => (
              <option key={p.province_id} value={p.province_id}>{p.province_name}</option>
            ))}
          </select>

          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            className="border rounded px-3 py-2"
            disabled={!selectedProvinceId}
          >
            <option value="">All Cities</option>
            {cities.map(c => (
              <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
            ))}
          </select>

          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="border rounded px-3 py-2"
            disabled={!selectedCityId}
          >
            <option value="">All Police Stations</option>
            {stations.map(s => (
              <option key={s.station_id} value={s.station_id}>{s.station_name}</option>
            ))}
          </select>

          {/* NEW Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="Filed">Filed</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFirs?.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">
            No FIRs found matching your criteria.
          </div>
        ) : (
          filteredFirs?.map(fir => (
            <motion.div
              key={fir.fir_id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-4">
                <h3 className="font-bold text-lg">{fir.title}</h3>
                <p className="text-gray-600 text-sm">Number: {fir.fir_number}</p>
                <p className="text-gray-600 text-sm">Station: {fir.station_name || 'N/A'}</p>
                <p className="text-gray-600 text-sm">City: {fir.city_name || 'N/A'}</p>
                <p className="text-gray-600 text-sm">Province: {fir.province_name || 'N/A'}</p>
                <p className="text-gray-600 text-sm">Status: 
                  <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                    fir.status === 'Filed' ? 'bg-yellow-100 text-yellow-800' :
                    fir.status === 'Under Investigation' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {fir.status}
                  </span>
                </p>
                <p className="text-gray-500 text-sm mt-2">Filed: {new Date(fir.date_filed).toLocaleDateString()}</p>
                <div className="mt-4 flex justify-between items-center">
                  <Link
                    to={`/fir/${fir.fir_id}`}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" /> View Details
                  </Link>
                  {localStorage.getItem('role') === 'Officer' && (
                    <button
                      onClick={() => handleDelete(fir.fir_id)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default FIRList;