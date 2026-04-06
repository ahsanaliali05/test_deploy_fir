import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import RelativeDetailsModal from './RelativeDetailsModal';
import CriminalDetailsModal from './CriminalDetailsModal';
import FamilyCrimeHistory from './FamilyCrimeHistory';   // new import

function CriminalRelations() {
  const { id } = useParams();
  const [criminal, setCriminal] = useState(null);
  const [relations, setRelations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRelation, setSelectedRelation] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [showCriminalModal, setShowCriminalModal] = useState(false);
  const [showCrimeHistory, setShowCrimeHistory] = useState(false);   // new state

  useEffect(() => {
    Promise.all([
      api.get(`/api/criminal/${id}`),
      api.get(`/api/criminal/${id}/relations`)
    ])
      .then(([criminalData, relationsData]) => {
        setCriminal(criminalData);
        setRelations(relationsData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const openModal = (relation, title) => {
    if (relation) {
      setSelectedRelation(relation);
      setModalTitle(title);
    }
  };

  const closeModal = () => {
    setSelectedRelation(null);
    setModalTitle('');
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  const RelationCard = ({ title, relation }) => {
    const hasRelation = !!relation;
    return (
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition flex flex-col">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
        {hasRelation ? (
          <>
            <p className="font-bold text-gray-800 text-lg mt-1">{relation.full_name}</p>
            {relation.alias && <p className="text-sm text-gray-500 mt-1">Alias: {relation.alias}</p>}
            <button
              onClick={() => openModal(relation, title)}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium self-start"
            >
              View Details →
            </button>
          </>
        ) : (
          <p className="text-gray-400 mt-2">—</p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          {/* Header with criminal photo and basic info */}
          <div className="flex items-center gap-4 mb-8">
            {criminal.photo_url && (
              <img
                src={`http://127.0.0.1:8000${criminal.photo_url}`}
                alt={criminal.full_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{criminal.full_name}</h1>
              <p className="text-gray-600">Criminal ID: {criminal.criminal_id}</p>
              {criminal.alias && <p className="text-gray-500">Alias: {criminal.alias}</p>}
              <button
                onClick={() => setShowCriminalModal(true)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Full Criminal Details →
              </button>
            </div>
          </div>

          {/* Family Tree Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
            <RelationCard title="Grandfather" relation={relations.grandfather} />
            <RelationCard title="Father" relation={relations.father} />
            <div className="bg-indigo-50 rounded-xl p-4 text-center border-2 border-indigo-500 flex flex-col justify-center">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Criminal</p>
              <p className="font-bold text-xl text-gray-800 mt-1">{criminal.full_name}</p>
            </div>
            <RelationCard title="Son" relation={relations.son} />
            <RelationCard title="Grandson" relation={relations.grandson} />
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setShowCrimeHistory(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition btn-hover-scale"
            >
              View Family Crime History
            </button>
          </div>
          <div className="mt-4 text-center text-gray-500 text-sm">
            * Click "View Details" on any relative to see full information (CNIC, address, etc.).
          </div>
        </div>
      </div>

      {selectedRelation && (
        <RelativeDetailsModal
          relation={selectedRelation}
          title={modalTitle}
          onClose={closeModal}
        />
      )}

      {showCriminalModal && (
        <CriminalDetailsModal
          criminal={criminal}
          onClose={() => setShowCriminalModal(false)}
        />
      )}

      {showCrimeHistory && (
        <FamilyCrimeHistory
          criminalId={id}
          onClose={() => setShowCrimeHistory(false)}
        />
      )}
    </div>
  );
}

export default CriminalRelations;