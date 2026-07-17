// Global complaint data store — Supabase-backed with localStorage fallback
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import supabase from '../services/supabaseClient';

const ComplaintContext = createContext(null);

// ── Auth seed (kept in memory / localStorage, no DB table needed) ──────────
const SEED_USERS = [
  { id: 'USR-001', name: 'Admin User',  email: 'admin@cms.com',    role: 'admin', password: 'admin123' },
  { id: 'USR-002', name: 'John Doe',    email: 'john@example.com', role: 'user',  password: 'user123'  },
];

// ── Map app complaint → Supabase row (only known columns) ──────────────────
const toDbRow = (c) => ({
  id:                c.id,
  title:             c.title,
  description:       c.description,
  category:          c.category          || null,
  priority:          c.priority          || 'medium',
  status:            c.status            || 'pending',
  submittedBy:       c.submittedBy       || null,
  email:             c.email             || null,
  phone:             c.phone             || null,
  studentDepartment: c.studentDepartment || null,
  studentYear:       c.studentYear       || null,
  department:        c.department        || null,
  assignedTo:        c.assignedTo        || null,
  createdAt:         c.createdAt,
  updatedAt:         c.updatedAt,
  // Store rollNumber + attachments inside aiAnalysis JSON so nothing is lost
  aiAnalysis: {
    ...(c.aiAnalysis || {}),
    _rollNumber:  c.rollNumber   || null,
    _attachments: c.attachments  || [],
  },
  notes:             Array.isArray(c.notes) ? c.notes : [],
  resolutionMessage: c.resolutionMessage || null,
});

// ── Map Supabase row → app complaint (restore extra fields) ────────────────
const fromDbRow = (row) => {
  const ai = row.aiAnalysis || {};
  const { _rollNumber, _attachments, ...cleanAi } = ai;
  return {
    ...row,
    aiAnalysis:  cleanAi,
    rollNumber:  _rollNumber  || '',
    attachments: _attachments || [],
    notes:       Array.isArray(row.notes) ? row.notes : [],
  };
};

// ── Seed complaints (only used when Supabase table is empty) ───────────────
const SEED_COMPLAINTS = [
  {
    id: 'CMP-001', title: 'Street light not working on Main Ave',
    description: 'The street light at the corner of Main Ave and 5th Street has been out for over a week. Safety hazard at night.',
    category: 'Infrastructure', priority: 'high', status: 'in-progress',
    submittedBy: 'John Doe', email: 'john.doe@example.com', phone: '+91 9876500101',
    studentDepartment: 'Civil', studentYear: '3rd Year', department: 'Civil',
    createdAt: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
    updatedAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
    aiAnalysis: { summary: 'Non-functional street lighting creating safety hazard.', suggestedResponse: 'Maintenance team dispatched.' },
    notes: ['Maintenance team notified', 'Scheduled for repair Thursday'], attachments: [],
  },
  {
    id: 'CMP-002', title: 'Water supply disruption in Sector 7',
    description: 'No water supply in our area for 3 days. Multiple households affected. Urgent resolution needed.',
    category: 'Infrastructure', priority: 'critical', status: 'pending',
    submittedBy: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91 9876500102',
    studentDepartment: 'Other', studentYear: 'Postgraduate', department: 'Administration',
    createdAt: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
    updatedAt: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
    aiAnalysis: { summary: 'Critical water supply outage affecting multiple households.', suggestedResponse: 'Emergency water supply teams alerted.' },
    notes: [], attachments: [],
  },
  {
    id: 'CMP-003', title: 'Library AC not working for 2 weeks',
    description: 'The air conditioning in the main library reading hall has been non-functional for two weeks. Exam season is ongoing.',
    category: 'Library', priority: 'medium', status: 'resolved',
    submittedBy: 'Alex Johnson', email: 'alex.j@example.com', phone: '+91 9876500103',
    studentDepartment: 'Computer Science', studentYear: '2nd Year', department: 'Administration',
    createdAt: new Date(Date.now() - 14*24*60*60*1000).toISOString(),
    updatedAt: new Date(Date.now() - 10*24*60*60*1000).toISOString(),
    aiAnalysis: { summary: 'Library AC malfunction affecting student study environment.', suggestedResponse: 'AC unit has been repaired. Service resumed.' },
    notes: ['Technician called', 'Repaired on Day 3'], attachments: [],
  },
  {
    id: 'CMP-004', title: 'Hostel mess food quality very poor',
    description: 'The quality of food in the hostel mess has deteriorated significantly this month. Multiple students are falling sick.',
    category: 'Hostel', priority: 'high', status: 'in-progress',
    submittedBy: 'Sarah Chen', email: 'sarah.chen@example.com', phone: '+91 9876500104',
    studentDepartment: 'Information Technology', studentYear: '1st Year', department: 'Administration',
    createdAt: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
    updatedAt: new Date(Date.now() - 4*60*60*1000).toISOString(),
    aiAnalysis: { summary: 'Food quality degradation in hostel mess causing health concerns.', suggestedResponse: 'Mess committee has been notified. Inspection scheduled.' },
    notes: ['Mess supervisor informed', 'Health inspection ordered'], attachments: [],
  },
  {
    id: 'CMP-005', title: 'Wi-Fi very slow in CS block',
    description: 'Internet speed in the Computer Science block has been below 1 Mbps for a week. Downloads and online exams are affected.',
    category: 'Academic', priority: 'low', status: 'resolved',
    submittedBy: 'Mike Wilson', email: 'mike.w@example.com', phone: '+91 9876500105',
    studentDepartment: 'Computer Science', studentYear: '4th Year', department: 'Computer Science',
    createdAt: new Date(Date.now() - 5*24*60*60*1000).toISOString(),
    updatedAt: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
    aiAnalysis: { summary: 'Network speed issue in CS block disrupting academic activities.', suggestedResponse: 'Network switch upgraded. Speeds restored to normal.' },
    notes: ['IT team visited', 'Router firmware updated'], attachments: [],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
export function ComplaintProvider({ children }) {
  const [complaints,   setComplaints]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [dbError,      setDbError]      = useState(null);
  const [currentUser,  setCurrentUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('cms_current_user')); } catch { return null; }
  });
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cms_notifications')) || []; } catch { return []; }
  });

  const notificationsRef = useRef(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
    localStorage.setItem('cms_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // ── Load complaints from Supabase on mount ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        // No Supabase configured — use seed data
        setComplaints(SEED_COMPLAINTS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .order('createdAt', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setComplaints(data.map(fromDbRow));
        } else {
          // Empty table → seed it
          const rows = SEED_COMPLAINTS.map(toDbRow);
          const { error: seedErr } = await supabase.from('complaints').insert(rows);
          if (seedErr) {
            console.warn('Seed insert failed:', seedErr.message);
          }
          setComplaints(SEED_COMPLAINTS);
        }
      } catch (err) {
        console.error('Supabase load error:', err);
        setDbError(err.message);
        // Fall back to seed data
        setComplaints(SEED_COMPLAINTS);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ── Auto-escalation check ─────────────────────────────────────────────────
  useEffect(() => {
    if (loading || complaints.length === 0) return;
    const now = new Date();
    const prolonged = complaints.filter(
      c => c.status === 'pending' && (now - new Date(c.createdAt)) / (1000 * 60 * 60) > 48
    );
    if (prolonged.length > 0) {
      const recentEsc = notificationsRef.current.find(
        n => n.type === 'escalation' && (now - new Date(n.createdAt)) / (1000 * 60) < 60
      );
      if (!recentEsc) {
        addNotification(
          'admin', 'Auto-Escalation Alert',
          `${prolonged.length} pending ticket(s) exceeded 48-hour SLA. Immediate triage required.`,
          'escalation'
        );
      }
    }
  }, [complaints, loading]);

  // ── Notifications ─────────────────────────────────────────────────────────
  const addNotification = (target, title, message, type = 'info') => {
    setNotifications(prev => [{
      id: `NOT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      target, title, message, type, read: false,
      createdAt: new Date().toISOString(),
    }, ...prev].slice(0, 50));
  };

  const markNotificationsAsRead = (target) => {
    setNotifications(prev => prev.map(n => n.target === target ? { ...n, read: true } : n));
  };

  // ── addComplaint ──────────────────────────────────────────────────────────
  const addComplaint = async (complaint) => {
    const newComplaint = {
      ...complaint,
      id:        `CMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status:    'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes:     [],
      attachments: [],
    };

    // Optimistic update
    setComplaints(prev => [newComplaint, ...prev]);

    // Persist to Supabase
    if (supabase) {
      const { error } = await supabase.from('complaints').insert(toDbRow(newComplaint));
      if (error) {
        console.error('Supabase insert error:', error.message);
        setDbError(`Save failed: ${error.message}`);
      }
    }

    // Notifications
    addNotification(newComplaint.email, 'Ticket Logged', `Your complaint (${newComplaint.id}) was submitted successfully.`, 'success');
    if (newComplaint.priority === 'critical' || newComplaint.aiAnalysis?.sentiment === 'Critical') {
      addNotification('admin', 'CRITICAL PRIORITY Incident', `Urgent ticket (${newComplaint.id}) filed by ${newComplaint.submittedBy}.`, 'critical');
    } else {
      addNotification('admin', 'New Ticket', `Ticket (${newComplaint.id}) submitted by ${newComplaint.submittedBy}.`, 'info');
    }

    return newComplaint;
  };

  // ── updateComplaint ───────────────────────────────────────────────────────
  const updateComplaint = async (id, updates) => {
    const updatedAt = new Date().toISOString();

    // Optimistic update
    setComplaints(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...updates, updatedAt };

      if (updates.status && updates.status !== c.status) {
        const msg = updates.status === 'resolved'
          ? `Your ticket (${id}) was resolved. ${updates.resolutionMessage || ''}`
          : `Status of ticket (${id}) updated to ${updates.status.toUpperCase()}.`;
        addNotification(c.email, 'Ticket Update', msg, updates.status === 'resolved' ? 'success' : 'info');
      }
      return updated;
    }));

    // Persist to Supabase
    if (supabase) {
      const { error } = await supabase
        .from('complaints')
        .update({ ...updates, updatedAt })
        .eq('id', id);
      if (error) {
        console.error('Supabase update error:', error.message);
        setDbError(`Update failed: ${error.message}`);
      }
    }
  };

  // ── updateMultipleComplaints ──────────────────────────────────────────────
  const updateMultipleComplaints = async (ids, updates) => {
    const updatedAt = new Date().toISOString();

    setComplaints(prev => prev.map(c => {
      if (!ids.includes(c.id)) return c;
      if (updates.status && updates.status !== c.status) {
        addNotification(c.email, 'Ticket Update (Bulk)', `Ticket (${c.id}) status → ${updates.status.toUpperCase()}.`, 'info');
      }
      return { ...c, ...updates, updatedAt };
    }));

    if (supabase) {
      const { error } = await supabase
        .from('complaints')
        .update({ ...updates, updatedAt })
        .in('id', ids);
      if (error) {
        console.error('Supabase bulk update error:', error.message);
        setDbError(`Bulk update failed: ${error.message}`);
      }
    }
  };

  // ── deleteComplaint ───────────────────────────────────────────────────────
  const deleteComplaint = async (id) => {
    setComplaints(prev => prev.filter(c => c.id !== id));

    if (supabase) {
      const { error } = await supabase.from('complaints').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete error:', error.message);
        setDbError(`Delete failed: ${error.message}`);
      }
    }
  };

  // ── addNote ───────────────────────────────────────────────────────────────
  const addNote = async (complaintId, note) => {
    const complaint = complaints.find(c => c.id === complaintId);
    const newNotes = [...(complaint?.notes || []), note];
    const updatedAt = new Date().toISOString();

    setComplaints(prev => prev.map(c =>
      c.id === complaintId ? { ...c, notes: newNotes, updatedAt } : c
    ));

    if (supabase) {
      const { error } = await supabase
        .from('complaints')
        .update({ notes: newNotes, updatedAt })
        .eq('id', complaintId);
      if (error) console.error('Note update error:', error.message);
    }
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = (email, password) => {
    const user = SEED_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      const { password: _, ...safeUser } = user;
      setCurrentUser(safeUser);
      localStorage.setItem('cms_current_user', JSON.stringify(safeUser));
      return { success: true, user: safeUser };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cms_current_user');
  };

  // ── Analytics helpers ─────────────────────────────────────────────────────
  const getStats = () => {
    const total      = complaints.length;
    const pending    = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in-progress').length;
    const resolved   = complaints.filter(c => c.status === 'resolved').length;
    const rejected   = complaints.filter(c => c.status === 'rejected').length;
    const highPriority = complaints.filter(c => c.priority === 'high' || c.priority === 'critical').length;
    return { total, pending, inProgress, resolved, rejected, highPriority };
  };

  const getCategoryDistribution = () => {
    const cats = {};
    complaints.forEach(c => { cats[c.category] = (cats[c.category] || 0) + 1; });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  };

  const getMonthlyTrend = () => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const [y, m] = [d.getFullYear(), d.getMonth()];
      const submitted = complaints.filter(c => { const cd = new Date(c.createdAt); return cd.getFullYear()===y && cd.getMonth()===m; }).length;
      const resolved  = complaints.filter(c => { const cd = new Date(c.updatedAt);  return c.status==='resolved' && cd.getFullYear()===y && cd.getMonth()===m; }).length;
      return { month: months[m], submitted, resolved };
    });
  };

  const getStatusDistribution = () => {
    const s = {};
    complaints.forEach(c => {
      const label = c.status === 'in-progress' ? 'In Progress' : c.status.charAt(0).toUpperCase() + c.status.slice(1);
      s[label] = (s[label] || 0) + 1;
    });
    return Object.entries(s).map(([name, value]) => ({ name, value }));
  };

  const getAverageResolutionTime = () => {
    const res = complaints.filter(c => c.status === 'resolved');
    if (!res.length) return '0 hrs';
    const avgMs = res.reduce((acc, c) => acc + (new Date(c.updatedAt) - new Date(c.createdAt)), 0) / res.length;
    const hours = Math.round(avgMs / (1000 * 60 * 60));
    return hours < 24 ? `${hours} hrs` : `${Math.round(hours / 24)} days`;
  };

  // ── Refetch helper (pull fresh data from Supabase) ────────────────────────
  const refetch = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('createdAt', { ascending: false });
    if (!error && data) setComplaints(data.map(fromDbRow));
    if (error) setDbError(error.message);
    setLoading(false);
  };

  return (
    <ComplaintContext.Provider value={{
      complaints, loading, dbError,
      currentUser, notifications,
      markNotificationsAsRead,
      addComplaint, updateComplaint, updateMultipleComplaints,
      deleteComplaint, addNote,
      login, logout, refetch,
      getStats, getCategoryDistribution,
      getMonthlyTrend, getStatusDistribution,
      getAverageResolutionTime,
    }}>
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  const ctx = useContext(ComplaintContext);
  if (!ctx) throw new Error('useComplaints must be used within ComplaintProvider');
  return ctx;
}
