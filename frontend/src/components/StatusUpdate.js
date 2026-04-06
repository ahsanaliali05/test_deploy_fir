import React, { useState } from 'react';
import api from '../api';

function StatusUpdate({ firId, currentStatus, onUpdate }) {
  const [status, setStatus] = useState(currentStatus);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const officerId = localStorage.getItem('user_id') || 1;

    try {
      const response = await api.put(`/api/fir/${firId}/status`, {
        status,
        officer_id: officerId,
        remarks
      });
      setSuccess('Status updated successfully');
      setError('');
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">Update FIR Status</h3>
      <form onSubmit={handleSubmit}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="Filed">Filed</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Completed">Completed</option>
        </select>
        <textarea
          placeholder="Remarks (optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-blue-500"
          rows="2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
        {success && <p className="text-green-600 mt-2 text-sm">{success}</p>}
        {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
      </form>
    </div>
  );
}

export default StatusUpdate;