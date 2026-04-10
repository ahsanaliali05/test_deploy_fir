import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import StatusUpdate from './StatusUpdate';
import LinkCriminalForm from './LinkCriminalForm'; // new component

function FIRDetails() {
  const { id } = useParams();
  const [fir, setFir] = useState(null);
  const [witnesses, setWitnesses] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [history, setHistory] = useState([]);
  const [criminals, setCriminals] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userRole = localStorage.getItem('role');

  useEffect(() => {
    Promise.all([
      api.get(`/api/fir/${id}`),
      api.get(`/api/fir/${id}/witnesses`),
      api.get(`/api/fir/${id}/evidence`),
      api.get(`/api/fir/${id}/history`),
      api.get(`/api/fir/${id}/criminals`)
    ])
      .then(([firData, witnessesData, evidenceData, historyData, criminalsData]) => {
        setFir(firData);
        setWitnesses(witnessesData);
        setEvidence(evidenceData);
        setHistory(historyData);
        setCriminals(criminalsData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const refreshData = () => {
    Promise.all([
      api.get(`/api/fir/${id}`),
      api.get(`/api/fir/${id}/history`),
      api.get(`/api/fir/${id}/criminals`)
    ])
      .then(([firData, historyData, criminalsData]) => {
        setFir(firData);
        setHistory(historyData);
        setCriminals(criminalsData);
      })
      .catch(console.error);
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  const tabs = ['details', 'witnesses', 'evidence', 'criminals', 'history'];
  if (userRole === 'Officer') {
    tabs.push('link-criminal');
    tabs.push('update');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">FIR Details</h1>
          <div className="border-b mb-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 capitalize transition ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab === 'link-criminal' ? 'Link Criminal' : tab}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'details' && (
            <div className="space-y-2">
              <p><strong>FIR Number:</strong> {fir.fir_number}</p>
              <p><strong>Title:</strong> {fir.title}</p>
              <p><strong>Description:</strong> {fir.description}</p>
              <p><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  fir.status === 'Filed' ? 'bg-yellow-100 text-yellow-800' :
                  fir.status === 'Under Investigation' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {fir.status}
                </span>
              </p>
              <p><strong>Date Filed:</strong> {new Date(fir.date_filed).toLocaleString()}</p>
              <p><strong>Citizen:</strong> {fir.citizen_name}</p>
              <p><strong>Station:</strong> {fir.station_name}</p>
              <p><strong>Officer Badge:</strong> {fir.officer_badge}</p>
              <p><strong>Category:</strong> {fir.category_name}</p>
            </div>
          )}

          {activeTab === 'witnesses' && (
            <div>
              <h3 className="font-semibold mb-2">Witnesses</h3>
              {witnesses.length === 0 ? (
                <p>No witnesses added yet.</p>
              ) : (
                <div className="space-y-2">
                  {witnesses.map(w => (
                    <div key={w.witness_id} className="border p-3 rounded">
                      <p><strong>Name:</strong> {w.full_name}</p>
                      <p><strong>Statement:</strong> {w.statement}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div>
              <h3 className="font-semibold mb-2">Evidence</h3>
              {evidence.length === 0 ? (
                <p>No evidence uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {evidence.map(e => (
                    <div key={e.evidence_id} className="border p-3 rounded">
                      <p><strong>Description:</strong> {e.description}</p>
                      <p><strong>File Path:</strong> {e.file_path}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'criminals' && (
            <div>
              <h3 className="font-semibold mb-2">Linked Criminals</h3>
              {criminals.length === 0 ? (
                <p>No criminals linked to this FIR.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {criminals.map(c => (
                    <div key={c.criminal_id} className="border p-3 rounded flex items-center space-x-3">
                      {c.photo_url && (
                        <img
                          src={`https://fir-management-system.onrender.com${c.photo_url}`}
                          alt={c.full_name}
                          className="w-12 h-12 object-cover rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{c.full_name}</p>
                        <p className="text-sm text-gray-600">Role: {c.role}</p>
                        {c.alias && <p className="text-sm">Alias: {c.alias}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="font-semibold mb-2">Status History</h3>
              {history.length === 0 ? (
                <p>No status changes recorded.</p>
              ) : (
                <div className="space-y-2">
                  {history.map(h => (
                    <div key={h.history_id} className="border-l-4 border-blue-600 pl-3 py-2">
                      <p className="font-semibold">{h.status}</p>
                      <p className="text-sm text-gray-600">{new Date(h.changed_at).toLocaleString()}</p>
                      {h.remarks && <p className="text-sm">Remarks: {h.remarks}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'link-criminal' && (
            <LinkCriminalForm firId={id} onLinked={refreshData} />
          )}

          {activeTab === 'update' && (
            <StatusUpdate
              firId={id}
              currentStatus={fir.status}
              onUpdate={refreshData}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default FIRDetails;
