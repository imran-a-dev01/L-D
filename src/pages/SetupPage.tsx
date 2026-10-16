import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api, UserProfile } from '../services/api';

interface SetupPageProps {
  onSetupComplete: (user: UserProfile) => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onSetupComplete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const passwordChecks = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your work email address.');
      return;
    }
    if (!isPasswordStrong) {
      setErrorMessage('Please meet all password requirements.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.setupAdmin(name.trim(), email.trim(), password);
      setIsLoading(false);
      onSetupComplete(res.user);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Setup failed. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-end p-4 sm:p-8 lg:pr-16 xl:pr-24 overflow-hidden font-['Inter',sans-serif]">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/login_new.mp4"
      />

      <div className="relative z-20 w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
        <div className="glass-morphism-card-light rounded-3xl p-7 sm:p-9 border border-white/90 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E3EAF5] shadow-xs mb-3">
              <span className="text-base font-black tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
                L & T
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#016DD9] shadow-[0_0_8px_#016DD9]" />
              <span className="text-xs text-[#64748B] font-semibold">L&D Intelligence</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B4D] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Initial Setup
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">
              Configure the first administrator account to get started.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="glass-morphism-input-light w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none transition-all duration-150"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="glass-morphism-input-light w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none transition-all duration-150"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 12 characters"
                  className="glass-morphism-input-light w-full pl-11 pr-11 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0B1B4D] transition-colors p-1 rounded-lg cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 text-[10px]">
                  {[
                    { key: 'length', label: '12+ characters' },
                    { key: 'lowercase', label: 'Lowercase letter' },
                    { key: 'uppercase', label: 'Uppercase letter' },
                    { key: 'number', label: 'Number' },
                    { key: 'special', label: 'Special character' },
                  ].map(({ key, label }) => (
                    <div key={key} className={`flex items-center gap-1 ${passwordChecks[key as keyof typeof passwordChecks] ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="glass-morphism-input-light w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none transition-all duration-150"
                />
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-[10px] text-rose-500 mt-0.5">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isPasswordStrong || !passwordsMatch}
              className="btn-shake w-full py-3 sm:py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold text-white bg-[#016DD9] hover:bg-[#005bb8] shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create Administrator Account</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-[11px] text-[#94A3B8]">
            This setup is available only once. Additional users can be created after login.
          </div>
        </div>
      </div>
    </div>
  );
};
