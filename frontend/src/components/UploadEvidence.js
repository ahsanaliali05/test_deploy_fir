import React, { useState } from 'react';
import api from '../api';

function UploadEvidence({ firId, onUploaded }) {
  const [description, setDescription] = useState('');
  const [filePath, setFilePath] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uploadedBy = localStorage.getItem('user_id');
    try {
      await api.post('/api/evidence', {
        fir_id: firId,
        description,
        file_path: filePath,
        uploaded_by: uploadedBy
      });
      setSuccess('Evidence uploaded');
      setError('');
      if (onUploaded) onUploaded();
      setDescription('');
      setFilePath('');
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  return (
    <div className="subcard">
      <h3>Upload Evidence</h3>
      <form onSubmit={handleSubmit}>
        <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required />
        <input placeholder="File Path" value={filePath} onChange={e => setFilePath(e.target.value)} required />
        <button type="submit">Upload</button>
      </form>
      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default UploadEvidence;