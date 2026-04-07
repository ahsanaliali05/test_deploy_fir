import React, { useState } from 'react';
import api from '../api';

function AddWitness({ firId, onAdded }) {
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [statement, setStatement] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/witness', {
        fir_id: firId,
        full_name: fullName,
        contact_info: contactInfo,
        statement
      });
      setSuccess('Witness added');
      setError('');
      if (onAdded) onAdded();
      setFullName('');
      setContactInfo('');
      setStatement('');
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  return (
    <div className="subcard">
      <h3>Add Witness</h3>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
        <input placeholder="Contact Info" value={contactInfo} onChange={e => setContactInfo(e.target.value)} required />
        <textarea placeholder="Statement" value={statement} onChange={e => setStatement(e.target.value)} rows="3" />
        <button type="submit">Add Witness</button>
      </form>
      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default AddWitness;