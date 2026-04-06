import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, FileText, Users, PlusCircle, UserPlus, CheckCircle, Lock } from 'lucide-react';

function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          FIR System
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/" className="hover:text-gray-200 transition flex items-center gap-1">
            <Home className="w-4 h-4" /> Login
          </Link>
          {role && role !== 'Citizen' && (
            <Link to="/dashboard" className="hover:text-gray-200 transition flex items-center gap-1">
              <Users className="w-4 h-4" /> Dashboard
            </Link>
          )}
          <Link to="/firs" className="hover:text-gray-200 transition flex items-center gap-1">
            <FileText className="w-4 h-4" /> FIRs
          </Link>
          {role && role !== 'Admin' && (
            <Link to="/create-fir" className="hover:text-gray-200 transition flex items-center gap-1">
              <PlusCircle className="w-4 h-4" /> Create FIR
            </Link>
          )}
          {role === 'Officer' && (
            <>
              <Link to="/criminals" className="hover:text-gray-200 transition flex items-center gap-1">
                <Users className="w-4 h-4" /> Criminals
              </Link>
              <Link to="/create-criminal" className="hover:text-gray-200 transition flex items-center gap-1">
                <UserPlus className="w-4 h-4" /> Create Criminal
              </Link>
            </>
          )}
          {role && role !== 'Citizen' && (
            <Link to="/completed" className="hover:text-gray-200 transition flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Completed
            </Link>
          )}
          <Link to="/change-password" className="hover:text-gray-200 transition flex items-center gap-1">
            <Lock className="w-4 h-4" /> Change Password
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;