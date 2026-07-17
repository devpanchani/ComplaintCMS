import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, FileText, CheckCircle, Clock,
  AlertTriangle, TrendingUp, Zap, ArrowRight,
  Brain, RefreshCw, Timer, PieChart as PieChartIcon,
  BarChart as BarChartIcon, Activity, Flame, ShieldAlert, Database
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { useComplaints } from '../context/ComplaintContext';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { getDashboardInsights } from '../services/geminiService';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
const STATUS_COLORS = { 'Pending': '#f59e0b', 'In Progress': '#06b6d4', 'Resolved': '#10b981', 'Rejected': '#f43f5e' };

/* ─── Animated counter hook ─────────────────────────────────── */
function useCounter(target, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const num = typeof target === 'number' ? target : parseFloat(target) || 0;
    if (num === 0) { setCount(0); return; }
    let start = 0;
    const step = num / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ─── Floating orb background ────────────────────────────────── */
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="fixed inset-0 grid-bg opacity-100" />
    </div>
  );
}

/* ─── Custom chart tooltip ───────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl p-3 border border-slate-700/50 text-sm shadow-2xl">
        <p className="text-slate-300 font-semibold mb-1.5">{label}</p>
        {payload.map((e, i) => (
          <p key={i} style={{ color: e.color || e.fill }} className="font-medium">
            {e.name}: <span className="text-white font-bold">{e.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Stat card with animated counter ────────────────────────── */
function StatCard({ title, value, icon: Icon, color, gradient, subtitle, progress, delay }) {
  const count = useCounter(typeof value === 'number' ? value : 0);
  const displayValue = typeof value === 'number' ? count : value;

  return (
    <div
      className={`stat-card animate-slide-up delay-${delay}`}
      style={{ '--c': color }}
    >
      {/* Top glow strip */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: gradient }}
          >
            <Icon className="w-5 h-5 text-white drop-shadow" />
          </div>
          {progress !== undefined && (
            <span className="text-xs font-bold tabular-nums" style={{ color }}>
              {progress}%
            </span>
          )}
        </div>

        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1.5">{title}</p>
        <p className="text-4xl font-black text-white tracking-tight leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {displayValue}
        </p>
        {subtitle && <p className="text-slate-500 text-xs mt-2">{subtitle}</p>}

        {progress !== undefined && (
          <div className="progress-bar mt-3">
            <div
              className="progress-fill"
              style={{ width: `${progress}%`, background: gradient }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Thinking dots loader ────────────────────────────────────── */
function ThinkingLoader() {
  return (
    <div className="flex items-center gap-3">
      <div className="thinking-dots flex items-center">
        <span /><span /><span />
      </div>
      <span className="text-slate-400 text-sm">AI is analyzing complaint patterns…</span>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────────── */
export default function Dashboard() {
  const {
    complaints, getStats, getCategoryDistribution,
    getMonthlyTrend, getStatusDistribution, getAverageResolutionTime,
    dbError, loading
  } = useComplaints();

  const [aiInsights, setAiInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  const stats = getStats();
  const categoryData = getCategoryDistribution();
  const trendData = getMonthlyTrend();
  const statusData = getStatusDistribution();
  const avgResolutionTime = getAverageResolutionTime();

  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    setAiInsights('');
    const insights = await getDashboardInsights(stats);
    setAiInsights(insights);
    setLoadingInsights(false);
  };

  useEffect(() => { fetchInsights(); }, [stats.total]);

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
  const pendingRate    = stats.total > 0 ? Math.round((stats.pending  / stats.total) * 100) : 0;

  return (
    <>
      <FloatingOrbs />

      <div className="relative z-content min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* ── Hero Header ──────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10 animate-slide-left">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
                <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">Live Dashboard</span>
              </div>
              <h1 className="text-4xl font-black text-white leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Operations{' '}
                <span className="gradient-text-cool">Overview</span>
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                Real-time analytics · AI-powered resolution insights · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Link
              to="/submit"
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-sm transition-all btn-ripple glow-blue shadow-lg shadow-blue-500/25 w-fit"
            >
              <Zap className="w-4 h-4" />
              File New Complaint
              <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
            </Link>

            {/* DB Connection Status */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              dbError
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span className={`w-1.5 h-1.5 rounded-full ${dbError ? 'bg-rose-400' : 'bg-emerald-400 pulse-dot'}`} />
              {dbError ? 'DB Error' : 'Supabase Live'}
            </div>
          </div>

          {/* ── Stat Cards ───────────────────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
            <StatCard
              title="Total Complaints" value={stats.total}
              icon={FileText} color="#3b82f6"
              gradient="linear-gradient(135deg,#2563eb,#4f46e5)"
              subtitle="All time records" delay="100"
            />
            <StatCard
              title="Pending" value={stats.pending}
              icon={Clock} color="#f59e0b"
              gradient="linear-gradient(135deg,#d97706,#f59e0b)"
              progress={pendingRate} delay="200"
            />
            <StatCard
              title="In Progress" value={stats.inProgress}
              icon={Activity} color="#06b6d4"
              gradient="linear-gradient(135deg,#0891b2,#06b6d4)"
              delay="300"
            />
            <StatCard
              title="Resolved" value={stats.resolved}
              icon={CheckCircle} color="#10b981"
              gradient="linear-gradient(135deg,#059669,#10b981)"
              progress={resolutionRate}
              subtitle={`${resolutionRate}% resolution rate`} delay="400"
            />
            <StatCard
              title="Avg Resolution" value={avgResolutionTime}
              icon={Timer} color="#8b5cf6"
              gradient="linear-gradient(135deg,#7c3aed,#8b5cf6)"
              delay="500"
            />
          </div>

          {/* ── AI Insights Panel ────────────────────────── */}
          <div className="relative glass-card p-6 mb-8 border-glow-animated animate-slide-up delay-300 overflow-hidden">
            {/* BG accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Executive AI Insights</h3>
                    <p className="text-slate-500 text-xs">Powered by OpenRouter AI · Auto-refreshes on new data</p>
                  </div>
                </div>
                <button
                  onClick={fetchInsights}
                  disabled={loadingInsights}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all text-sm border border-violet-500/20 hover:border-violet-400/40 font-medium"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loadingInsights ? (
                <ThinkingLoader />
              ) : aiInsights ? (
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {aiInsights}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Click Refresh to fetch AI insights.</p>
              )}
            </div>
          </div>

          {/* ── Alert Banner for High Priority ──────────── */}
          {stats.highPriority > 0 && (
            <div className="glass-card p-4 mb-8 animate-slide-up delay-400 border border-rose-500/20 bg-rose-500/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                </div>
                <div className="flex-1">
                  <p className="text-rose-300 font-semibold text-sm">
                    {stats.highPriority} high-priority complaint{stats.highPriority > 1 ? 's' : ''} require immediate attention
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">Review and assign these tickets to ensure SLA compliance</p>
                </div>
                <Link to="/complaints" className="flex items-center gap-1.5 text-rose-400 text-sm font-semibold hover:text-rose-300 transition-colors">
                  Review <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ── Charts Row 1 ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

            {/* Trend Area Chart */}
            <div className="lg:col-span-2 glass-card p-6 animate-slide-up delay-400">
              <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Monthly Volume Trend
              </h3>
              <p className="text-slate-500 text-xs mb-5">Submitted vs Resolved over last 6 months</p>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" stroke="#1e2d4a" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis stroke="#1e2d4a" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="submitted" stroke="#3b82f6" fill="url(#gSubmitted)" strokeWidth={2.5} name="Submitted" dot={{ fill: '#3b82f6', r: 3 }} />
                  <Area type="monotone" dataKey="resolved"  stroke="#10b981" fill="url(#gResolved)"  strokeWidth={2.5} name="Resolved"  dot={{ fill: '#10b981', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Status Donut */}
            <div className="glass-card p-6 animate-slide-up delay-500">
              <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-emerald-400" />
                Status Split
              </h3>
              <p className="text-slate-500 text-xs mb-4">Current ticket distribution</p>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData} cx="50%" cy="42%"
                    innerRadius={65} outerRadius={95}
                    dataKey="value" labelLine={false}
                    strokeWidth={2} stroke="#050913"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={`c-${i}`} fill={STATUS_COLORS[entry.name] || PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}>{v}</span>} />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Charts Row 2 ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

            {/* Category Bar */}
            <div className="glass-card p-6 animate-slide-up delay-500">
              <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                <BarChartIcon className="w-5 h-5 text-amber-400" />
                Category Breakdown
              </h3>
              <p className="text-slate-500 text-xs mb-5">Complaints grouped by type</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" stroke="#1e2d4a" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" stroke="#1e2d4a" width={85} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="value" name="Complaints" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {categoryData.map((_, i) => (
                      <Cell key={`c-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Activity Timeline */}
            <div className="glass-card p-6 animate-slide-up delay-600 flex flex-col">
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-400" />
                    Recent Activity
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Latest submitted tickets</p>
                </div>
                <Link to="/complaints" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                {recentComplaints.map((c, i) => (
                  <Link
                    key={c.id}
                    to="/complaints"
                    className="timeline-item flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-all group"
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 text-white shadow-md"
                      style={{ background: `linear-gradient(135deg,${PIE_COLORS[i % PIE_COLORS.length]}80,${PIE_COLORS[(i+2) % PIE_COLORS.length]}60)` }}
                    >
                      {c.submittedBy?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate group-hover:text-blue-300 transition-colors leading-tight">
                        {c.title}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5 truncate">{c.submittedBy} · {c.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                    </div>
                  </Link>
                ))}
                {recentComplaints.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                    <FileText className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No complaints yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
