import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload } from 'lucide-react';
import api from '../api';

function UpdateCriminal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    full_name: '',
    alias: '',
    date_of_birth: '',
    address: '',
    cnic: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [relations, setRelations] = useState({
    grandfather: { cnic: '', full_name: '', alias: '', date_of_birth: '', address: '' },
    father: { cnic: '', full_name: '', alias: '', date_of_birth: '', address: '' },
    son: { cnic: '', full_name: '', alias: '', date_of_birth: '', address: '' },
    grandson: { cnic: '', full_name: '', alias: '', date_of_birth: '', address: '' }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const criminalData = await api.get(`/api/criminal/${id}`);
        setForm({
          full_name: criminalData.full_name || '',
          alias: criminalData.alias || '',
          date_of_birth: criminalData.date_of_birth || '',
          address: criminalData.address || '',
          cnic: criminalData.cnic || '',
        });
        if (criminalData.photo_url) {
          setPhotoPreview(`http://127.0.0.1:8000${criminalData.photo_url}`);
        }
        
        const relationsData = await api.get(`/api/criminal/${id}/full-relations`);
        setRelations(prev => ({
          ...prev,
          ...relationsData
        }));
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load criminal data');
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateRelation = (relation, field, value) => {
    setRelations(prev => ({
      ...prev,
      [relation]: { ...prev[relation], [field]: value }
    }));
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first.');
      return;
    }

    if (!form.cnic || form.cnic.trim() === '') {
      setError('CNIC is required');
      return;
    }

    const formData = new FormData();
    formData.append('full_name', form.full_name);
    if (form.alias) formData.append('alias', form.alias);
    if (form.date_of_birth) formData.append('date_of_birth', form.date_of_birth);
    if (form.address) formData.append('address', form.address);
    formData.append('cnic', form.cnic);
    if (photoFile) formData.append('photo', photoFile);

    const relationsArray = Object.entries(relations).map(([relType, details]) => ({
      relationship_type: relType,
      ...details
    })).filter(rel => rel.full_name && rel.full_name.trim() !== '');
    formData.append('relations', JSON.stringify(relationsArray));

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/criminal/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Update failed');
      setSuccess('Criminal updated successfully!');
      setTimeout(() => navigate('/criminals'), 2000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update criminal. Check network or server.');
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Update Criminal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
              <input
                name="alias"
                value={form.alias}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNIC *</label>
              <input
                name="cnic"
                value={form.cnic}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 12345-6789012-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Choose New Photo
                  <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                </label>
                {photoPreview && <img src={photoPreview} alt="Preview" className="w-12 h-12 rounded-full object-cover border" />}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Family Relations (Optional)</h3>
              {['grandfather', 'father', 'son', 'grandson'].map(rel => (
                <div key={rel} className="mb-4 p-3 border rounded">
                  <h4 className="font-medium capitalize mb-2">{rel}</h4>
                  <input type="text" placeholder="CNIC" value={relations[rel]?.cnic || ''} onChange={e => updateRelation(rel, 'cnic', e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <input type="text" placeholder="Full Name" value={relations[rel]?.full_name || ''} onChange={e => updateRelation(rel, 'full_name', e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <input type="text" placeholder="Alias" value={relations[rel]?.alias || ''} onChange={e => updateRelation(rel, 'alias', e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <input type="date" placeholder="Date of Birth" value={relations[rel]?.date_of_birth || ''} onChange={e => updateRelation(rel, 'date_of_birth', e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <textarea placeholder="Address" value={relations[rel]?.address || ''} onChange={e => updateRelation(rel, 'address', e.target.value)} rows="2" className="w-full p-2 border rounded" />
                </div>
              ))}
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition btn-hover-scale">
              Update Criminal
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-600 text-sm mt-2">{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default UpdateCriminal;