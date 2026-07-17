import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ComplaintProvider } from './context/ComplaintContext';
import { useComplaints } from './context/ComplaintContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import ViewComplaints from './pages/ViewComplaints';
import AdminPage from './pages/AdminPage';
import AiAnalytics from './pages/AiAnalytics';
import { Database } from 'lucide-react';

// ── Loading screen shown while Supabase data is fetching ─────────────────
function AppLoader() {
  const { loading } = useComplaints();
  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: 'rgba(5,9,19,0.97)', backdropFilter: 'blur(20px)' }}>
      {/* Animated orbs in bg */}
      <div className="orb orb-1 opacity-40" />
      <div className="orb orb-2 opacity-30" />

      <div className="relative z-10 flex flex-col items-center gap-5 animate-scale-in">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center glow-blue shadow-2xl animate-float">
          <Database className="w-8 h-8 text-white" />
        </div>

        {/* Spinner */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-700 border-t-blue-400 rounded-full animate-spin" />
          <span className="text-slate-300 font-medium text-sm">Connecting to database…</span>
        </div>

        {/* Thinking dots */}
        <div className="thinking-dots flex items-center gap-1">
          <span style={{ background: '#3b82f6' }} /><span style={{ background: '#8b5cf6' }} /><span style={{ background: '#06b6d4' }} />
        </div>

        <p className="text-slate-600 text-xs mt-1">ComplaintCMS · AI-Powered Management</p>
      </div>
    </div>
  );
}

function AppInner() {
  return (
    <Router>
      <div className="min-h-screen page-bg text-slate-100 font-sans selection:bg-blue-500/30">
        <AppLoader />
        <Navbar />
        <main>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/submit"     element={<SubmitComplaint />} />
            <Route path="/complaints" element={<ViewComplaints />} />
            <Route path="/admin"      element={<AdminPage />} />
            <Route path="/analytics"  element={<AiAnalytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ComplaintProvider>
      <AppInner />
    </ComplaintProvider>
  );
}

export default App;
