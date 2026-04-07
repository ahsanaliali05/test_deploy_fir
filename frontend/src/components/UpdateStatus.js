import React, { useState } from 'react';
import api from '../api';

function UpdateStatus({ firId, onUpdated }) {
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const officerId = localStorage.getItem('user_id'); // you might store this on login
    try {
      await api.put(`/api/fir/${firId}/status`, {
        status,
        officer_id: officerId,
        remarks
      });
      setSuccess('Status updated');
      setError('');
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  return (
    <div className="subcard">
      <h3>Update Status</h3>
      <form onSubmit={handleSubmit}>
        <input placeholder="New Status" value={status} onChange={e => setStatus(e.target.value)} required />
        <input placeholder="Remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
        <button type="submit">Update</button>
      </form>
      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default UpdateStatus;