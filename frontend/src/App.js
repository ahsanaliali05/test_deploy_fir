import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import ChangePassword from './components/ChangePassword';
import Dashboard from './components/Dashboard';
import FIRList from './components/FIRList';
import FIRDetails from './components/FIRDetails';
import CreateFIR from './components/CreateFIR';
import CriminalList from './components/CriminalList';
import CriminalRelations from './components/CriminalRelations';
import CreateCriminal from './components/CreateCriminal';
import CompletedCases from './components/CompletedCases';
import UpdateCriminal from './components/UpdateCriminal';
import './index.css';

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/firs" element={<FIRList />} />
          <Route path="/fir/:id" element={<FIRDetails />} />
          <Route path="/create-fir" element={<CreateFIR />} />
          <Route path="/criminals" element={<CriminalList />} />
          <Route path="/criminal/:id/relations" element={<CriminalRelations />} />
          <Route path="/create-criminal" element={<CreateCriminal />} />
          <Route path="/completed" element={<CompletedCases />} />
          <Route path="/update-criminal/:id" element={<UpdateCriminal />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Navbar />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 2000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

export default App;