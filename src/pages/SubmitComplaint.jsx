import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus,
  Sparkles,
  Send,
  CheckCircle,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Tag,
  MessageSquare,
  Brain,
  Building2,
  IdCard,
  GraduationCap,
  CalendarDays,
  UploadCloud,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useComplaints } from '../context/ComplaintContext';
import { analyzeComplaint } from '../services/geminiService';

const CATEGORIES = ['Academic', 'Infrastructure', 'Hostel', 'Canteen', 'Library', 'Administration', 'Sports', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Other'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

// ── Validation rules ────────────────────────────────────────
// Proper email: local@domain.tld  (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
// Phone: 7-15 digits, optional leading +, spaces/dashes allowed
const PHONE_REGEX = /^[+]?[\d][\d\s\-().]{5,18}[\d]$/;

function FormField({ label, icon: Icon, children, error, success }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
        {label}
      </label>
      {children}
      {error   && <p className="text-rose-400 text-xs flex items-center gap-1 animate-fade-in"><AlertTriangle className="w-3 h-3 flex-shrink-0" />{error}</p>}
      {!error && success && <p className="text-emerald-400 text-xs flex items-center gap-1 animate-fade-in"><CheckCircle className="w-3 h-3 flex-shrink-0" />{success}</p>}
    </div>
  );
}

// Dynamic input class — red border on error, green on valid focus
const inputCls = (err, ok) =>
  `w-full px-4 py-2.5 rounded-xl border text-white placeholder-slate-500 text-sm input-focus transition-all duration-200 ${
    err ? 'bg-rose-500/5 border-rose-500/50'
    : ok ? 'bg-emerald-500/5 border-emerald-500/30'
    : 'bg-slate-800/60 border-slate-600/50'
  }`;

const selectClass = "w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-600/50 text-white text-sm input-focus appearance-none cursor-pointer";

export default function SubmitComplaint() {
  const { addComplaint, currentUser } = useComplaints();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Academic',
    priority: 'medium',
    department: 'Computer Science',
    submittedBy: currentUser?.name || '',
    rollNumber: '',
    studentDepartment: 'Computer Science',
    studentYear: '1st Year',
    email: currentUser?.email || '',
    phone: '+91 ',
  });

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error as user types
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  // Real-time validation on blur (single field)
  const validateField = (field) => {
    const v = (form[field] || '').trim();
    let err = '';
    if (field === 'email') {
      if (!v)                          err = 'Email address is required';
      else if (!EMAIL_REGEX.test(v))   err = 'Enter a valid email — e.g. name@university.edu';
    }
    if (field === 'phone') {
      // Extract digits after the +91 prefix
      const digits = v.replace('+91', '').replace(/\D/g, '');
      if (digits.length > 0 && digits.length < 10) err = 'Enter a valid 10-digit mobile number';
      if (digits.length > 10)                       err = 'Mobile number must be exactly 10 digits';
    }
    if (err) setErrors(prev => ({ ...prev, [field]: err }));
  };

  // Check if a field currently has a valid value (for green state)
  const isValid = (field) => {
    const v = (form[field] || '').trim();
    if (field === 'email') return v && EMAIL_REGEX.test(v) && !errors.email;
    if (field === 'phone') {
      const digits = (form.phone || '').replace('+91', '').replace(/\D/g, '');
      return digits.length === 10 && !errors.phone;
    }
    return false;
  };

  // Full form validation before AI step
  const validate = () => {
    const e = {};
    if (!form.submittedBy.trim())   e.submittedBy = 'Full name is required';
    if (!form.rollNumber.trim())    e.rollNumber  = 'Roll number is required';
    if (!form.email.trim())         e.email = 'Email address is required';
    else if (!EMAIL_REGEX.test(form.email.trim())) e.email = 'Enter a valid email — e.g. name@university.edu';
    if (form.phone.trim()) {
      const digits = form.phone.replace('+91', '').replace(/\D/g, '');
      if (digits.length > 0 && digits.length !== 10)
        e.phone = 'Enter a valid 10-digit mobile number after +91';
    }
    if (!form.title.trim())         e.title = 'Subject / title is required';
    if (!form.description.trim() || form.description.length < 20)
      e.description = 'Description must be at least 20 characters';
    return e;
  };

  const handleAnalyze = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    
    setAnalyzing(true);
    const result = await analyzeComplaint(form.title, form.description);
    setAiResult(result);
    setAnalyzing(false);
    setStep(2);
  };

  const handleSubmit = () => {
    const complaintData = {
      ...form,
      aiAnalysis: aiResult || {},
    };
    addComplaint(complaintData);
    setSubmitted(true);
    setStep(3);
  };

  if (submitted) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-10 max-w-lg w-full text-center animate-slide-up bg-slate-900/50">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 glow-cyan">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Issue Logged Securely!</h2>
          <p className="text-slate-400 mb-2 text-sm">Your complaint ticket has been forwarded to the relevant department.</p>
          
          {aiResult && (
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-5 mt-6 mb-5 text-left shadow-lg shadow-violet-500/5">
              <p className="text-violet-300 text-xs font-semibold uppercase tracking-wide mb-3">AI Support Assistant</p>
              
              <p className="text-slate-300 text-sm italic border-l-2 border-violet-500/50 pl-3 mb-4 text-left">"{aiResult.suggestedResponse}"</p>
              
              {aiResult.estimatedResolutionTime && (
                <div className="flex items-center gap-2 mb-4 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 shadow-inner">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-300"><strong>Estimated Timeline:</strong> {aiResult.estimatedResolutionTime}</span>
                </div>
              )}

              {aiResult.suggestedSolution && (
                 <div className="mb-4">
                   <p className="text-emerald-400 text-xs uppercase font-medium tracking-wide mb-1.5 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5"/> Immediate Auto-Resolution Strategy</p>
                   <p className="text-slate-300 text-xs leading-relaxed">{aiResult.suggestedSolution}</p>
                 </div>
              )}

              {aiResult.helpfulTips && aiResult.helpfulTips.length > 0 && (
                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                   <p className="text-cyan-400 text-xs uppercase font-medium tracking-wide mb-2">Helpful Tips While You Wait</p>
                   <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                     {aiResult.helpfulTips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                   </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => { 
                setSubmitted(false); 
                setStep(1); 
                setForm(prev => ({...prev, title:'', description:'', rollNumber:''})); 
                setAiResult(null); 
                setFileName('');
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors text-sm font-medium"
            >
              Log Another Core Issue
            </button>
            <button
              onClick={() => navigate('/complaints')}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors text-sm shadow-lg shadow-blue-500/20"
            >
              Track Request Log
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8 animate-slide-left">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FilePlus className="w-8 h-8 text-blue-400" />
            Submit Complaint
          </h1>
          <p className="text-slate-400 mt-1">Please provide accurate details to help us resolve your issue faster</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-3 mb-8 animate-slide-up">
          {[
            { n: 1, label: 'Form Details' },
            { n: 2, label: 'AI Review' },
            { n: 3, label: 'Submitted' },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= n ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {n}
              </div>
              <span className={`text-sm hidden sm:block ${step >= n ? 'text-white' : 'text-slate-500'}`}>{label}</span>
              {i < 2 && <div className={`flex-1 h-px mx-1 ${step > n ? 'bg-blue-500' : 'bg-slate-700'}`} style={{ width: 24 }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="glass rounded-2xl p-6 space-y-6 animate-slide-up">
            
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                <IdCard className="w-5 h-5" /> Student Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <FormField label="Full Name" icon={User} error={errors.submittedBy}>
                  <input className={inputCls(errors.submittedBy)} placeholder="Student Name" value={form.submittedBy} onChange={e => update('submittedBy', e.target.value)} />
                </FormField>
                <FormField label="Roll Number" icon={IdCard} error={errors.rollNumber}>
                  <input className={inputCls(errors.rollNumber)} placeholder="e.g. CS21B1001" value={form.rollNumber} onChange={e => update('rollNumber', e.target.value)} />
                </FormField>
                <FormField label="Department" icon={GraduationCap}>
                  <select className={selectClass} value={form.studentDepartment} onChange={e => update('studentDepartment', e.target.value)}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </FormField>
                <FormField label="Year of Study" icon={CalendarDays}>
                  <select className={selectClass} value={form.studentYear} onChange={e => update('studentYear', e.target.value)}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </FormField>
                <FormField
                  label="Email Address" icon={Mail}
                  error={errors.email}
                  success={isValid('email') ? 'Valid email address ✓' : ''}
                >
                  <div className="relative">
                    <input
                      type="email"
                      className={inputCls(errors.email, isValid('email'))}
                      placeholder="student@university.edu"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      onBlur={() => validateField('email')}
                      autoComplete="email"
                    />
                    {isValid('email') && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
                    )}
                    {errors.email && (
                      <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 pointer-events-none" />
                    )}
                  </div>
                </FormField>

                <FormField
                  label="Phone Number" icon={Phone}
                  error={errors.phone}
                  success={isValid('phone') ? 'Valid mobile number ✓' : ''}
                >
                  {/* Fixed +91 prefix + digit-only input */}
                  <div
                    className={`flex items-center rounded-xl border overflow-hidden transition-all duration-200 ${
                      errors.phone
                        ? 'border-rose-500/50 bg-rose-500/5'
                        : isValid('phone')
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-slate-600/50 bg-slate-800/60'
                    }`}
                  >
                    {/* Prefix badge */}
                    <div className="flex items-center gap-1.5 px-3 py-2.5 border-r border-slate-600/50 bg-slate-700/40 flex-shrink-0 select-none">
                      <span className="text-lg leading-none">🇮🇳</span>
                      <span className="text-white font-semibold text-sm">+91</span>
                    </div>

                    {/* Number input */}
                    <input
                      type="tel"
                      inputMode="numeric"
                      className="flex-1 px-3 py-2.5 bg-transparent text-white placeholder-slate-500 text-sm outline-none min-w-0"
                      placeholder="98765 43210"
                      value={form.phone.replace(/^\+91\s?/, '')}
                      onChange={e => {
                        // Only allow digits and spaces
                        const digits = e.target.value.replace(/[^\d\s]/g, '').slice(0, 12);
                        update('phone', '+91 ' + digits);
                      }}
                      onBlur={() => validateField('phone')}
                      autoComplete="tel-national"
                      maxLength={12}
                    />

                    {/* Status icon */}
                    {isValid('phone') && (
                      <CheckCircle className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                    )}
                    {errors.phone && (
                      <AlertTriangle className="w-4 h-4 text-rose-400 mr-3 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-slate-600 text-xs mt-1">Optional · Enter 10-digit Indian mobile number</p>
                </FormField>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-slate-200 font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Complaint Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Category" icon={Tag}>
                    <select className={selectClass} value={form.category} onChange={e => update('category', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Concerned Dept." icon={Building2}>
                    <select className={selectClass} value={form.department} onChange={e => update('department', e.target.value)}>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Priority" icon={AlertCircle}>
                    <select className={selectClass} value={form.priority} onChange={e => update('priority', e.target.value)}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </FormField>
                </div>

                <FormField label="Subject / Title" icon={MessageSquare} error={errors.title}>
                  <input className={inputCls(errors.title)} placeholder="Brief subject" value={form.title} onChange={e => update('title', e.target.value)} />
                </FormField>

                <FormField label="Detailed Description" icon={MessageSquare} error={errors.description}>
                  <textarea
                    rows={4}
                    className={`${inputCls(errors.description)} resize-none`}
                    placeholder="Describe your issue in detail..."
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                  />
                  <p className="text-slate-600 text-xs text-right mt-1">{form.description.length} chars</p>
                </FormField>

                <FormField label="Upload Evidence (Optional)" icon={UploadCloud}>
                  <div className="relative w-full">
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <label 
                      htmlFor="file-upload" 
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-dashed border-slate-500 hover:border-blue-400 text-slate-400 hover:text-blue-300 transition-colors cursor-pointer text-sm"
                    >
                      <UploadCloud className="w-5 h-5" />
                      {fileName ? <span className="text-white truncate">{fileName}</span> : <span>Click to upload images or documents</span>}
                    </label>
                  </div>
                </FormField>
              </div>
            </div>

            <button
              id="analyzeBtn"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold text-sm transition-all btn-ripple disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Review Details
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: AI Review */}
        {step === 2 && (
          <div className="space-y-5 animate-slide-up">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Confirm Details</h3>
              <div className="space-y-3 text-sm bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <div className="flex gap-2"><span className="text-slate-500 w-24">Student:</span><span className="text-white">{form.submittedBy} ({form.rollNumber})</span></div>
                <div className="flex gap-2"><span className="text-slate-500 w-24">Subject:</span><span className="text-white font-medium">{form.title}</span></div>
                <div className="flex gap-2"><span className="text-slate-500 w-24">Category:</span><span className="text-cyan-400">{form.category}</span></div>
                <div className="flex gap-2"><span className="text-slate-500 w-24">Priority:</span><span className="text-amber-400 uppercase text-xs font-bold mt-0.5">{form.priority}</span></div>
                <div className="flex gap-2"><span className="text-slate-500 w-24">Description:</span><span className="text-slate-300">{form.description}</span></div>
                {fileName && <div className="flex gap-2"><span className="text-slate-500 w-24">File:</span><span className="text-blue-300">{fileName}</span></div>}
              </div>
            </div>

            {aiResult && (
              <div className="glass rounded-2xl p-6 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">AI Insights</h3>
                    <p className="text-slate-500 text-xs">Powered by OpenRouter AI</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  <div>
                    <p className="text-slate-500 text-xs mb-1 uppercase tracking-wide">Sentiment</p>
                    <p className={`font-medium ${aiResult.sentiment === 'Frustrated' || aiResult.sentiment === 'Negative' ? 'text-rose-400' : aiResult.sentiment === 'Positive' ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {aiResult.sentiment}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1 uppercase tracking-wide">Urgency</p>
                    <p className="text-amber-400 font-medium truncate" title={aiResult.urgency}>{aiResult.urgency}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1 uppercase tracking-wide">Target Dept</p>
                    <p className="text-cyan-400 font-medium truncate" title={aiResult.department}>{aiResult.department}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1 uppercase tracking-wide">Category</p>
                    <p className="text-emerald-400 font-medium truncate" title={aiResult.category}>{aiResult.category}</p>
                  </div>
                </div>

                {aiResult.keyIssues && aiResult.keyIssues.length > 0 && (
                  <div className="mb-4 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 flex flex-col space-y-1">
                    <p className="text-slate-400 text-xs uppercase font-medium tracking-wide">Detected Key Issues</p>
                    <ul className="list-disc list-inside text-slate-300 text-sm">
                      {aiResult.keyIssues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 mb-4">
                  <p className="text-slate-400 text-xs uppercase font-medium tracking-wide mb-1">AI Summary</p>
                  <p className="text-slate-300 text-sm">{aiResult.summary}</p>
                </div>

                <div className="bg-violet-500/10 p-3 rounded-xl border border-violet-500/20">
                  <p className="text-violet-400 text-xs uppercase font-medium tracking-wide mb-1">Suggested Auto-Response</p>
                  <p className="text-slate-300 text-sm italic">"{aiResult.suggestedResponse}"</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setStep(1)} 
                className="flex-1 px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors text-sm"
              >
                ← Edit Details
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/20 text-white font-semibold text-sm transition-all btn-ripple"
              >
                <Send className="w-4 h-4" />
                Confirm & Submit
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
