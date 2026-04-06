import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api';

function CreateFIR() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [stations, setStations] = useState([]);
  const [categories, setCategories] = useState([]); // new state
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [witnesses, setWitnesses] = useState([{ full_name: '', contact_info: '', statement: '' }]);
  const [evidence, setEvidence] = useState([{ description: '', file: null }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const userRole = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  // Fetch provinces
  useEffect(() => {
    api.get('/api/provinces').then(setProvinces).catch(console.error);
  }, []);

  // Fetch categories
  useEffect(() => {
    api.get('/api/categories').then(setCategories).catch(console.error);
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      api.get(`/api/cities/${selectedProvince}`).then(setCities).catch(console.error);
    } else {
      setCities([]);
    }
    setSelectedCity('');
    setValue('station_id', '');
  }, [selectedProvince, setValue]);

  // Fetch stations when city changes
  useEffect(() => {
    if (selectedCity) {
      api.get(`/api/stations/${selectedCity}`).then(setStations).catch(console.error);
    } else {
      setStations([]);
    }
    setValue('station_id', '');
  }, [selectedCity, setValue]);

  const addWitness = () => {
    setWitnesses([...witnesses, { full_name: '', contact_info: '', statement: '' }]);
  };

  const updateWitness = (index, field, value) => {
    const updated = [...witnesses];
    updated[index][field] = value;
    setWitnesses(updated);
  };

  const removeWitness = (index) => {
    setWitnesses(witnesses.filter((_, i) => i !== index));
  };

  const addEvidence = () => {
    setEvidence([...evidence, { description: '', file: null }]);
  };

  const updateEvidenceDescription = (index, value) => {
    const updated = [...evidence];
    updated[index].description = value;
    setEvidence(updated);
  };

  const updateEvidenceFile = (index, file) => {
    const updated = [...evidence];
    updated[index].file = file;
    setEvidence(updated);
  };

  const removeEvidence = (index) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    if (!token) {
      setError('Please login first.');
      return;
    }

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('citizen_id', data.citizen_id);
    formData.append('officer_id', data.officer_id);
    formData.append('station_id', data.station_id);
    formData.append('category_id', data.category_id);
    formData.append('witnesses', JSON.stringify(witnesses.filter(w => w.full_name.trim() !== '')));
    
    const validEvidence = evidence.filter(e => e.description.trim() !== '' && e.file !== null);
    formData.append('evidence_count', validEvidence.length);
    validEvidence.forEach((e, idx) => {
      formData.append(`evidence_description_${idx}`, e.description);
      formData.append(`evidence_file_${idx}`, e.file);
    });

    try {
      const response = await fetch('http://127.0.0.1:8000/api/fir', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Creation failed');
      setSuccess(`FIR created with ID ${result.fir_id}, Number ${result.fir_number}`);
      setTimeout(() => navigate(`/fir/${result.fir_id}`), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Create New FIR</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input {...register('title', { required: 'Title is required' })} className="w-full p-2 border rounded" />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea {...register('description', { required: 'Description is required' })} rows="3" className="w-full p-2 border rounded" />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            {/* Citizen ID & Officer ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userRole !== 'Citizen' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Citizen ID *</label>
                  <input {...register('citizen_id', { required: 'Citizen ID is required' })} type="number" className="w-full p-2 border rounded" />
                  {errors.citizen_id && <p className="text-red-500 text-sm mt-1">{errors.citizen_id.message}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Officer ID *</label>
                <input {...register('officer_id', { required: 'Officer ID is required' })} type="number" className="w-full p-2 border rounded" />
                {errors.officer_id && <p className="text-red-500 text-sm mt-1">{errors.officer_id.message}</p>}
              </div>
            </div>

            {/* Category - now a dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                {...register('category_id', { required: 'Category is required' })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>}
            </div>

            {/* Province, City, Station */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className="w-full p-2 border rounded" required>
                  <option value="">Select Province</option>
                  {provinces.map(p => (<option key={p.province_id} value={p.province_id}>{p.province_name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full p-2 border rounded" disabled={!selectedProvince} required>
                  <option value="">Select City</option>
                  {cities.map(c => (<option key={c.city_id} value={c.city_id}>{c.city_name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Police Station *</label>
                <select {...register('station_id', { required: 'Police Station is required' })} className="w-full p-2 border rounded" disabled={!selectedCity}>
                  <option value="">Select Police Station</option>
                  {stations.map(s => (<option key={s.station_id} value={s.station_id}>{s.station_name}</option>))}
                </select>
                {errors.station_id && <p className="text-red-500 text-sm mt-1">{errors.station_id.message}</p>}
              </div>
            </div>

            {/* Witnesses section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Witnesses</h3>
              {witnesses.map((w, idx) => (
                <div key={idx} className="border p-3 rounded mb-2">
                  <input placeholder="Full Name" value={w.full_name} onChange={e => updateWitness(idx, 'full_name', e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <input placeholder="Contact Info" value={w.contact_info} onChange={e => updateWitness(idx, 'contact_info', e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <textarea placeholder="Statement" value={w.statement} onChange={e => updateWitness(idx, 'statement', e.target.value)} className="w-full p-2 border rounded mb-2" rows="2" />
                  <button type="button" onClick={() => removeWitness(idx)} className="text-red-600 hover:text-red-800">Remove Witness</button>
                </div>
              ))}
              <button type="button" onClick={addWitness} className="text-blue-600 hover:text-blue-800">+ Add Witness</button>
            </div>

            {/* Evidence section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Evidence (Images/Videos)</h3>
              {evidence.map((e, idx) => (
                <div key={idx} className="border p-3 rounded mb-2">
                  <input
                    placeholder="Description"
                    value={e.description}
                    onChange={ev => updateEvidenceDescription(idx, ev.target.value)}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={ev => updateEvidenceFile(idx, ev.target.files[0])}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <button type="button" onClick={() => removeEvidence(idx)} className="text-red-600 hover:text-red-800">Remove Evidence</button>
                </div>
              ))}
              <button type="button" onClick={addEvidence} className="text-blue-600 hover:text-blue-800">+ Add Evidence</button>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Create FIR</button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-600 text-sm mt-2">{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateFIR;