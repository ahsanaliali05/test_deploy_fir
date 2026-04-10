import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Upload } from 'lucide-react';
// api not used directly; we use fetch with token

function CreateCriminal() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [relations, setRelations] = useState({
    grandfather: { cnic: '', full_name: '', alias: '', date_of_birth: '', address: '' },
    father: { cnic: '', full_name: '', alias: '', date_of_birth: '', address: '' },
    son: { cnic: '', full_name: '', alias: '', date_of_birth: '', address: '' },
    grandson: { cnic: '', full_name: '', alias: '', date_of_birth: '', address: '' }
  });

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

  const onSubmit = async (data) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first.');
      return;
    }

    const formData = new FormData();
    formData.append('full_name', data.full_name);
    if (data.alias) formData.append('alias', data.alias);
    if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth);
    if (data.address) formData.append('address', data.address);
    formData.append('cnic', data.cnic);
    if (photoFile) formData.append('photo', photoFile);

    const relationsArray = Object.entries(relations).map(([relType, details]) => ({
      relationship_type: relType,
      ...details
    })).filter(rel => rel.full_name.trim() !== '');
    formData.append('relations', JSON.stringify(relationsArray));

    try {
      const response = await fetch('https://fir-management-system.onrender.com/api/criminal', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Creation failed');
      setSuccess(`Criminal created with ID ${result.criminal_id}`);
      setTimeout(() => navigate('/criminals'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create New Criminal</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input {...register('full_name', { required: 'Full name is required' })} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
              {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
              <input {...register('alias')} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" {...register('date_of_birth')} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea {...register('address')} rows="3" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNIC *</label>
              <input
                {...register('cnic', { required: 'CNIC is required' })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              {errors.cnic && <p className="text-red-500 text-sm mt-1">{errors.cnic.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Choose File
                  <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                </label>
                {photoPreview && <div className="w-12 h-12 rounded-full overflow-hidden border"><img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /></div>}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Family Relations (Optional)</h3>
              {['grandfather', 'father', 'son', 'grandson'].map(rel => (
                <div key={rel} className="mb-4 p-3 border rounded">
                  <h4 className="font-medium capitalize mb-2">{rel}</h4>
                  <input type="text" placeholder="CNIC" onChange={e => updateRelation(rel, 'cnic', e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <input type="text" placeholder="Full Name" onChange={e => updateRelation(rel, 'full_name', e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <input type="text" placeholder="Alias" onChange={e => updateRelation(rel, 'alias', e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <input type="date" placeholder="Date of Birth" onChange={e => updateRelation(rel, 'date_of_birth', e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <textarea placeholder="Address" onChange={e => updateRelation(rel, 'address', e.target.value)} rows="2" className="w-full p-2 border rounded" />
                </div>
              ))}
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition btn-hover-scale">Create Criminal</button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-600 text-sm mt-2">{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateCriminal;
