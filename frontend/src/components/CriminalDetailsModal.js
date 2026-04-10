import React from 'react';
import { X } from 'lucide-react';

function CriminalDetailsModal({ criminal, onClose }) {
  if (!criminal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Criminal Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {criminal.photo_url && (
            <div className="flex justify-center">
              <img
                src={`https://fir-management-system.onrender.com${criminal.photo_url}`}
                alt={criminal.full_name}
                className="w-32 h-32 rounded-full object-cover border-2 border-blue-500"
              />
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase">Full Name</p>
            <p className="font-semibold text-gray-800">{criminal.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Alias</p>
            <p className="text-gray-800">{criminal.alias || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Date of Birth</p>
            <p className="text-gray-800">{criminal.date_of_birth || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Gender</p>
            <p className="text-gray-800">{criminal.gender === 'M' ? 'Male' : criminal.gender === 'F' ? 'Female' : 'Other'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Address</p>
            <p className="text-gray-800 whitespace-pre-wrap">{criminal.address || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Identifying Marks</p>
            <p className="text-gray-800">{criminal.identifying_marks || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Created At</p>
            <p className="text-gray-800">{criminal.created_at ? new Date(criminal.created_at).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CriminalDetailsModal;
