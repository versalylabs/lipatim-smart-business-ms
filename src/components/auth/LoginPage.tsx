import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_ACCOUNT } from '../../types/auth';
import { validateKraPin } from '../../utils/kenya';
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  Store,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useApp();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('+254 7');
  const [regKraPin, setRegKraPin] = useState('');
  const [regBranchName, setRegBranchName] = useState('');

  const handleFillDemo = () => {
    setMode('LOGIN');
    setLoginEmail(DEMO_ACCOUNT.email);
    setLoginPassword(DEMO_ACCOUNT.password);
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(loginEmail.trim(), loginPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Invalid email or password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regBusinessName.trim()) {
      setErrorMsg('Please enter your business or company name.');
      return;
    }
    if (!regOwnerName.trim()) {
      setErrorMsg('Please enter the account owner or director full name.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Please enter a valid business email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (regKraPin.trim()) {
      const pinCheck = validateKraPin(regKraPin.trim());
      if (!pinCheck.isValid) {
        setErrorMsg(pinCheck.error || 'Invalid KRA PIN format (e.g. P051239841K).');
        return;
      }
    }

    setIsSubmitting(true);
    const result = await register({
      businessName: regBusinessName.trim(),
      ownerName: regOwnerName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone.trim(),
      kraPin: regKraPin.trim().toUpperCase() || undefined,
      branchName: regBranchName.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white relative">
      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 mb-1">
            <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md">
              LT
            </span>
            <span className="text-2xl font-black tracking-tight text-slate-900">LipaTim</span>
          </div>
          <h1 className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
            Smart Business Management &amp; eTIMS Engine
          </h1>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            Kenyan financial &amp; tax compliance ERP, Daraja M-Pesa point-of-sale, and multi-tenant inventory ledger.
          </p>
        </div>

        {/* Demo Credentials Callout Pill */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Current Demo Account</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
              Pre-seeded Data
            </span>
          </div>

          <div className="text-[11px] text-slate-700 space-y-0.5 font-mono">
            <div>
              Email: <span className="text-slate-900 font-bold">{DEMO_ACCOUNT.email}</span>
            </div>
            <div>
              Password: <span className="text-slate-900 font-bold">{DEMO_ACCOUNT.password}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Auto-Fill Demo Credentials</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          {/* Segmented Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'LOGIN'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'REGISTER'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register New Business
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="versalylabs@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono text-xs transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Password</label>
                  <span className="text-[10px] text-slate-500 font-medium">Demo: labversaly-16</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-xs mt-2"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter Business Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER NEW BUSINESS FORM (MULTITENANT CLEAN SYSTEM) */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Every newly registered business starts with a <strong>fresh, clean workspace</strong> with zero demo data.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Registered Business / Store Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regBusinessName}
                    onChange={(e) => setRegBusinessName(e.target.value)}
                    placeholder="e.g. Mwangaza Wholesale & Supermarket"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Owner / Director Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regOwnerName}
                      onChange={(e) => setRegOwnerName(e.target.value)}
                      placeholder="e.g. James Mwangi"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Safaricom Mobile Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+254 712 345 678"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono text-xs transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">KRA PIN (Optional)</label>
                  <input
                    type="text"
                    value={regKraPin}
                    onChange={(e) => setRegKraPin(e.target.value)}
                    placeholder="P051239841K"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono uppercase text-xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Primary Outlet Name</label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regBranchName}
                      onChange={(e) => setRegBranchName(e.target.value)}
                      placeholder="e.g. Main CBD Outlet"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Admin Email (Login Username)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="owner@mybusiness.co.ke"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono text-xs transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Choose Password (min 6 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-xs mt-3"
              >
                {isSubmitting ? (
                  <span>Initializing New Business Workspace...</span>
                ) : (
                  <>
                    <span>Create Fresh Business Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Feature Badges Footer */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600">
          <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>KRA eTIMS VSCU v2.1</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Safaricom Daraja STK</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col items-center gap-1 font-medium">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dedicated Business MS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
