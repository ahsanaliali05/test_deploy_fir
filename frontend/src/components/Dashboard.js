import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, AlertCircle, Video, TrendingUp, Award, UserX, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import ArrestedCriminals from './ArrestedCriminals';

function Dashboard() {
  const role = localStorage.getItem('role');
  const [latestFirs, setLatestFirs] = useState([]);
  const [completedCases, setCompletedCases] = useState([]);
  const [mostWanted, setMostWanted] = useState([]);
  const [scrollingIndex, setScrollingIndex] = useState(0);
  const [wantedLoading, setWantedLoading] = useState(true);
  const [rank, setRank] = useState('');
  const [pendingInvestigations, setPendingInvestigations] = useState([]);
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef(null);
  const speed = 0.5;

  // Fetch latest FIRs for officers/admins
  useEffect(() => {
    if (role !== 'Citizen') {
      api.get('/api/firs')
        .then(data => {
          const safeData = Array.isArray(data) ? data.filter(item => item != null) : [];
          const sorted = [...safeData].sort((a, b) => new Date(b.date_filed) - new Date(a.date_filed));
          setLatestFirs(sorted.slice(0, 5));
        })
        .catch(console.error);
    }
  }, [role]);

  // Fetch completed cases for officer/admin dashboard
  useEffect(() => {
    if (role !== 'Citizen') {
      api.get('/api/firs/completed')
        .then(data => {
          const safeData = Array.isArray(data) ? data.filter(item => item != null) : [];
          const sorted = [...safeData].sort((a, b) => new Date(b.date_completed) - new Date(a.date_completed));
          setCompletedCases(sorted);
        })
        .catch(console.error);
    }
  }, [role]);

  // Fetch most wanted criminals (all roles)
  useEffect(() => {
    const fetchMostWanted = async () => {
      setWantedLoading(true);
      try {
        const data = await api.get('/api/most-wanted');
        const safeData = Array.isArray(data) ? data.filter(item => item != null) : [];
        setMostWanted(safeData);
      } catch (err) {
        console.error('Failed to fetch most wanted:', err);
      } finally {
        setWantedLoading(false);
      }
    };
    fetchMostWanted();
  }, []);

  // Fetch officer rank and pending investigations
  useEffect(() => {
    if (role === 'Officer') {
      api.get('/api/officer/rank')
        .then(data => setRank(data.rank || ''))
        .catch(console.error);
      api.get('/api/officer/pending-investigations')
        .then(data => {
          const safeData = Array.isArray(data) ? data.filter(item => item != null) : [];
          setPendingInvestigations(safeData);
        })
        .catch(console.error);
    }
  }, [role]);

  // Auto-scroll for citizen rights (carousel)
  useEffect(() => {
    if (role === 'Citizen') {
      const interval = setInterval(() => {
        setScrollingIndex((prev) => (prev + 1) % rightsContent.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [role, rightsContent.length]);  

  // JavaScript infinite scroll for completed cases
  useEffect(() => {
    if (role === 'Citizen') return;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const step = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollTop += speed;
        if (scrollContainer.scrollTop >= scrollContainer.scrollHeight / 2) {
          scrollContainer.scrollTop = 0;
        }
      }
      animationRef.current = requestAnimationFrame(step);
    };
    animationRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPaused, role]);

  const rightsContent = [
    { title: "Right to Equality", description: "Every citizen is equal before the law. No discrimination based on religion, race, caste, sex, or place of birth." },
    { title: "Right to Freedom", description: "Freedom of speech, expression, assembly, association, movement, residence, and profession." },
    { title: "Right against Exploitation", description: "Prohibition of human trafficking, forced labor, and child labor." },
    { title: "Right to Constitutional Remedies", description: "Right to move to courts for enforcement of fundamental rights." },
    { title: "Right to Information", description: "Access to information held by public authorities." },
  ];

  const emergencyContacts = [
    { name: "Police", number: "15", icon: <Phone className="w-5 h-5" /> },
    { name: "Fire Brigade", number: "16", icon: <AlertCircle className="w-5 h-5" /> },
    { name: "Ambulance", number: "1122", icon: <Phone className="w-5 h-5" /> },
    { name: "Rescue 1122", number: "1122", icon: <AlertCircle className="w-5 h-5" /> },
    { name: "Women Helpline", number: "1098", icon: <Phone className="w-5 h-5" /> },
  ];

  // Most Wanted Section (shared by all roles)
  const MostWantedSection = () => (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
        <UserX className="text-red-600" /> Most Wanted Criminals
      </h2>
      {wantedLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : mostWanted.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No active cases linked to criminals.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mostWanted.map(criminal => (
            <div key={criminal.criminal_id} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-1/3 bg-gray-100 flex items-center justify-center p-4">
                  {criminal.photo_url ? (
                    <img
                      src={`https://fir-management-system.onrender.com${criminal.photo_url}`}
                      alt={criminal.full_name}
                      className="w-28 h-28 object-cover rounded-full border-2 border-red-500"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4 sm:w-2/3">
                  <h3 className="text-lg font-bold text-gray-800">{criminal.full_name}</h3>
                  <p className="text-sm text-gray-600 mb-2">Pending Cases: <span className="font-semibold text-red-600">{criminal.case_count}</span></p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold text-gray-700">Active FIRs:</p>
                    {criminal.firs && criminal.firs.map(fir => (
                      <Link
                        key={fir.fir_id}
                        to={`/fir/${fir.fir_id}`}
                        className="block text-sm text-blue-600 hover:underline"
                      >
                        {fir.fir_number} – {fir.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Infinite scrolling list for completed cases
  const CompletedCasesMarquee = () => {
    if (completedCases.length === 0) {
      return <p className="text-gray-500 text-center py-6">No completed cases yet.</p>;
    }

    const items = [...completedCases, ...completedCases];

    return (
      <div
        className="relative h-72 overflow-hidden bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-yellow-50 via-transparent to-yellow-50 z-10" />
        <div
          ref={scrollRef}
          className="h-full overflow-y-scroll scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((caseItem, idx) => (
            <div
              key={`${caseItem.fir_id}-${idx}`}
              className="py-3 border-b border-yellow-200 last:border-0"
            >
              <p className="text-lg font-semibold text-gray-800">🎉 Congratulations! 🎉</p>
              <p className="text-md text-gray-700">
                Officer Badge <span className="font-mono font-bold text-blue-600">{caseItem.officer_badge}</span> successfully completed case
              </p>
              <p className="text-sm text-gray-600">FIR #{caseItem.fir_number} – {caseItem.title}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Citizen Dashboard
  if (role === 'Citizen') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome, Citizen</h1>
            <p className="text-lg text-gray-600">Your rights matter. Stay informed and safe.</p>
          </motion.div>

          {/* Auto-scrolling Rights */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-blue-600 text-white px-6 py-3">
              <h2 className="text-xl font-semibold">📜 Fundamental Rights</h2>
            </div>
            <div className="relative h-44 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={scrollingIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 p-6 flex flex-col justify-center"
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{rightsContent[scrollingIndex].title}</h3>
                  <p className="text-gray-600 text-lg">{rightsContent[scrollingIndex].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Emergency Contacts Grid */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Phone className="text-red-500" /> Emergency Helplines
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {emergencyContacts.map((contact, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  className="bg-red-50 rounded-xl p-3 text-center cursor-pointer hover:shadow-lg transition"
                  onClick={() => window.location.href = `tel:${contact.number}`}
                >
                  <div className="flex justify-center mb-1 text-red-600">{contact.icon}</div>
                  <p className="font-semibold text-gray-800">{contact.name}</p>
                  <p className="text-xl font-bold text-red-600">{contact.number}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">🛡️ Safety Tips</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2"><span className="text-green-600">•</span> Always carry your identification.</li>
              <li className="flex items-start gap-2"><span className="text-green-600">•</span> Know your local police station number.</li>
              <li className="flex items-start gap-2"><span className="text-green-600">•</span> Report any suspicious activity immediately.</li>
              <li className="flex items-start gap-2"><span className="text-green-600">•</span> Stay informed about your rights.</li>
            </ul>
          </div>

          {/* Most Wanted Section */}
          <MostWantedSection />
        </div>
      </div>
    );
  }

  // Officer / Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Welcome, {role} – Monitor cases and stay updated.</p>
        </motion.div>

        {/* Officer Rank and Pending Investigations */}
        {role === 'Officer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                <Award className="text-yellow-500" /> Your Rank
              </h2>
              <p className="text-2xl font-bold text-blue-600">{rank || '—'}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                <Clock className="text-yellow-500" /> Pending Investigations
              </h2>
              {pendingInvestigations.length === 0 ? (
                <p className="text-gray-500">No pending cases assigned to you.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingInvestigations.map(caseItem => (
                    <div key={caseItem.fir_id} className="border rounded-lg p-3 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <Link to={`/fir/${caseItem.fir_id}`} className="font-semibold text-blue-600 hover:underline">
                          {caseItem.fir_number} – {caseItem.title}
                        </Link>
                        <button
                          onClick={() => toast.success('Reminder snoozed for 24h')}
                          className="text-gray-500 hover:text-gray-700 transition btn-hover-scale"
                          title="Snooze"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Filed: {new Date(caseItem.date_filed).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live News Feeds – ARY and Geo */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Video className="text-red-600" /> Live News
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="aspect-video">
              <iframe
                className="w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/vYTfRrA0rBw?autoplay=0&mute=1"
                title="ARY News Live"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="aspect-video">
              <iframe
                className="w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/_FwympjOSNE?autoplay=0&mute=1"
                title="Geo News Live"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>

        {/* Arrested Criminals Widget */}
        <div className="mb-6">
          <ArrestedCriminals />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Latest FIRs */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
              <TrendingUp className="text-blue-600" /> Latest FIRs
            </h2>
            {latestFirs.length === 0 ? (
              <p className="text-gray-500">No FIRs found.</p>
            ) : (
              <div className="space-y-3">
                {latestFirs.map(fir => (
                  <Link
                    key={fir.fir_id}
                    to={`/fir/${fir.fir_id}`}
                    className="block p-3 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{fir.title}</p>
                        <p className="text-sm text-gray-600">{fir.fir_number}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        fir.status === 'Filed' ? 'bg-yellow-100 text-yellow-800' :
                        fir.status === 'Under Investigation' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {fir.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Filed: {new Date(fir.date_filed).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Case Completion Honors – Infinite Scrolling List */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
              <Award className="text-yellow-500" /> Case Completion Honors
            </h2>
            <CompletedCasesMarquee />
          </div>
        </div>

        {/* Most Wanted Section */}
        <MostWantedSection />
      </div>
    </div>
  );
}

export default Dashboard;
