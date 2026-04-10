import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

function FamilyTree({ criminalId, onClose }) {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/criminal/${criminalId}/family-tree`)
      .then(data => {
        setTree(data.tree);
        data.warnings.forEach(warning => {
          toast(warning.message, {
            icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
            duration: 2000,
          });
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error('Could not load family tree');
        setLoading(false);
      });
  }, [criminalId]);

  if (loading) return <div className="p-4 text-center">Loading family tree...</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Family Tree</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="relative">
            {/* Grandparents */}
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="w-36 p-3 bg-blue-50 rounded-lg border border-blue-200 shadow">
                  <p className="text-xs text-gray-500">Grandfather</p>
                  <p className="font-medium">{tree?.grandfather?.full_name || '—'}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-36 p-3 bg-blue-50 rounded-lg border border-blue-200 shadow">
                  <p className="text-xs text-gray-500">Grandmother</p>
                  <p className="font-medium">{tree?.grandmother?.full_name || '—'}</p>
                </div>
              </div>
            </div>

            {/* Vertical line */}
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gray-300"></div>
            </div>

            {/* Parents */}
            <div className="flex justify-center gap-8 my-4">
              <div className="text-center">
                <div className="w-36 p-3 bg-blue-50 rounded-lg border border-blue-200 shadow">
                  <p className="text-xs text-gray-500">Father</p>
                  <p className="font-medium">{tree?.father?.full_name || '—'}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-36 p-3 bg-blue-50 rounded-lg border border-blue-200 shadow">
                  <p className="text-xs text-gray-500">Mother</p>
                  <p className="font-medium">{tree?.mother?.full_name || '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-px h-8 bg-gray-300"></div>
            </div>

            {/* Criminal */}
            <div className="flex justify-center my-4">
              <div className="w-44 p-4 bg-indigo-100 rounded-lg border-2 border-indigo-500 shadow-lg">
                <p className="text-xs text-gray-600">Criminal</p>
                <p className="font-bold text-lg">(Current Criminal)</p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-px h-8 bg-gray-300"></div>
            </div>

            {/* Children */}
            <div className="flex justify-center gap-8 my-4">
              <div className="text-center">
                <div className="w-36 p-3 bg-green-50 rounded-lg border border-green-200 shadow">
                  <p className="text-xs text-gray-500">Son</p>
                  <p className="font-medium">{tree?.son?.full_name || '—'}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-36 p-3 bg-green-50 rounded-lg border border-green-200 shadow">
                  <p className="text-xs text-gray-500">Grandson</p>
                  <p className="font-medium">{tree?.grandson?.full_name || '—'}</p>
                </div>
              </div>
            </div>

            {/* Extended family (optional) */}
            {(tree?.uncle?.full_name || tree?.aunt?.full_name) && (
              <>
                <div className="flex justify-center">
                  <div className="w-px h-8 bg-gray-300"></div>
                </div>
                <div className="flex justify-center gap-8">
                  {tree?.uncle?.full_name && (
                    <div className="text-center">
                      <div className="w-36 p-3 bg-yellow-50 rounded-lg border border-yellow-200 shadow">
                        <p className="text-xs text-gray-500">Uncle</p>
                        <p className="font-medium">{tree.uncle.full_name}</p>
                      </div>
                    </div>
                  )}
                  {tree?.aunt?.full_name && (
                    <div className="text-center">
                      <div className="w-36 p-3 bg-yellow-50 rounded-lg border border-yellow-200 shadow">
                        <p className="text-xs text-gray-500">Aunt</p>
                        <p className="font-medium">{tree.aunt.full_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FamilyTree;