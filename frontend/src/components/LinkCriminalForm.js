import React, { useState, useEffect } from 'react';
import api from '../api';

function LinkCriminalForm({ firId, onLinked }) {
  const [criminalId, setCriminalId] = useState('');
  const [role, setRole] = useState('');
  const [criminals, setCriminals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/api/criminals')
      .then(setCriminals)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/api/fir_criminal', {
        fir_id: parseInt(firId),
        criminal_id: parseInt(criminalId),
        role: role
      });
      setSuccess('Criminal linked successfully!');
      setCriminalId('');
      setRole('');
      if (onLinked) onLinked();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="font-semibold mb-3">Link a Criminal to this FIR</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Criminal</label>
          <select
            value={criminalId}
            onChange={(e) => setCriminalId(e.target.value)}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a criminal</option>
            {criminals.map(c => (
              <option key={c.criminal_id} value={c.criminal_id}>
                {c.full_name} {c.alias ? `(${c.alias})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select role</option>
            <option value="suspect">Suspect</option>
            <option value="accused">Accused</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition btn-hover-scale"
        >
          {loading ? 'Linking...' : 'Link Criminal'}
        </button>
        {success && <p className="text-green-600 text-sm mt-2">{success}</p>}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
}

export default LinkCriminalForm;