import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, List, Shield,
  Menu, X, LogOut, LogIn, Bell, User,
  ChevronDown, Zap, Brain, Sparkles
} from 'lucide-react';
import { useComplaints } from '../context/ComplaintContext';

const getNavItems = (currentUser) => {
  const items = [
    { to: '/',           label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/submit',     label: 'Submit',           icon: FilePlus },
    { to: '/complaints', label: 'Complaints',       icon: List },
    { to: '/admin',      label: 'Admin',            icon: Shield },
  ];
  if (currentUser?.role === 'admin') {
    items.push({ to: '/analytics', label: 'AI Analytics', icon: Brain });
  }
  return items;
};

const NOTIF_COLORS = {
  critical:   'text-rose-400   bg-rose-500/10   border-rose-500/20',
  escalation: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  success:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  info:       'text-blue-400   bg-blue-500/10   border-blue-500/20',
};

export default function Navbar() {
  const { currentUser, logout, notifications, markNotificationsAsRead } = useComplaints();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); setUserMenuOpen(false); navigate('/'); };

  const myNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n =>
      n.target === currentUser.email || (currentUser.role === 'admin' && n.target === 'admin')
    );
  }, [notifications, currentUser]);

  const unreadCount = myNotifications.filter(n => !n.read).length;

  const handleOpenNotif = () => {
    setNotifOpen(o => !o);
    if (!notifOpen && unreadCount > 0) {
      if (currentUser?.role === 'admin') markNotificationsAsRead('admin');
      markNotificationsAsRead(currentUser?.email);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(5,9,19,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ───────────────────────────────────── */}
            <NavLink to="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center glow-blue transition-transform group-hover:scale-110 shadow-lg">
                <Zap className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-black gradient-text-cool" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                  ComplaintCMS
                </span>
                <span className="block text-[10px] text-slate-500 -mt-0.5 font-medium tracking-widest uppercase">AI·Powered</span>
              </div>
            </NavLink>

            {/* ── Desktop Nav ────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.05] rounded-2xl px-2 py-1.5">
              {getNavItems(currentUser).map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/20 to-violet-600/20 text-blue-300 border border-blue-500/20 shadow-inner'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* ── Right Controls ─────────────────────────── */}
            <div className="flex items-center gap-2">

              {/* AI Badge */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/15 text-violet-400 text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                AI Active
              </div>

              {/* Notifications */}
              {currentUser && (
                <div className="relative">
                  <button
                    onClick={handleOpenNotif}
                    className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/[0.06]"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full pulse-ring" />
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-12 w-96 rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden animate-scale-in z-50"
                      style={{ background: 'rgba(8,14,32,0.96)', backdropFilter: 'blur(24px)' }}
                    >
                      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Bell className="w-4 h-4 text-blue-400" />
                          Notifications
                        </h3>
                        <span className="text-xs text-slate-500 bg-white/[0.05] px-2 py-0.5 rounded-lg">
                          {myNotifications.length} total
                        </span>
                      </div>
                      <div className="max-h-96 overflow-y-auto p-3 space-y-2">
                        {myNotifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-500 text-sm">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            No notifications yet
                          </div>
                        ) : (
                          myNotifications.map(n => (
                            <div
                              key={n.id}
                              className={`p-3 rounded-xl border text-left transition-opacity ${n.read ? 'opacity-50' : ''} ${NOTIF_COLORS[n.type] || NOTIF_COLORS.info}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold uppercase tracking-wide">{n.title}</span>
                                <span className="text-[10px] text-slate-500 ml-2 flex-shrink-0">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User menu / Sign In */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(o => !o)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/[0.07] hover:border-white/[0.14] transition-all text-sm bg-white/[0.03]"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow">
                      {currentUser.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="hidden sm:block text-slate-200 font-semibold text-sm">{currentUser.name}</span>
                    {currentUser.role === 'admin' && (
                      <span className="hidden sm:block text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold tracking-wide uppercase">
                        Admin
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-11 w-44 rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden animate-scale-in z-50"
                      style={{ background: 'rgba(8,14,32,0.97)', backdropFilter: 'blur(24px)' }}
                    >
                      <div className="p-1.5">
                        <div className="px-3 py-2 mb-1">
                          <p className="text-white text-xs font-bold truncate">{currentUser.name}</p>
                          <p className="text-slate-500 text-[10px] truncate">{currentUser.email}</p>
                        </div>
                        <div className="h-px bg-white/[0.06] mb-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to="/admin"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold transition-all btn-ripple shadow-lg shadow-blue-500/20"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">Sign In</span>
                </NavLink>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMobileOpen(o => !o)}
                className="md:hidden p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ─────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.06] animate-slide-up">
            <nav className="px-4 py-3 space-y-1">
              {getNavItems(currentUser).map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-300 border border-blue-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
