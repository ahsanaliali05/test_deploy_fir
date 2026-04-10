import React from 'react';
import { X } from 'lucide-react';

function RelativeDetailsModal({ relation, title, onClose }) {
  if (!relation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{title} Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Full Name</p>
            <p className="font-semibold text-gray-800">{relation.full_name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">CNIC</p>
            <p className="font-mono text-gray-800">{relation.cnic || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Alias</p>
            <p className="text-gray-800">{relation.alias || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Date of Birth</p>
            <p className="text-gray-800">
              {relation.date_of_birth ? new Date(relation.date_of_birth).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Address</p>
            <p className="text-gray-800 whitespace-pre-wrap">{relation.address || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RelativeDetailsModal;