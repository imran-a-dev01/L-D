import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2
} from 'lucide-react';
import { api, UserProfile } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your work email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      setIsLoading(false);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Unable to connect to server. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-end p-4 sm:p-8 lg:pr-16 xl:pr-24 overflow-hidden font-['Inter',sans-serif]">
      {/* Background Video: login_new.mp4 - 100% crisp and clear with zero hazy overlay */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/login_new.mp4"
      />

      {/* Glassmorphism Login Credentials Card - Positioned on the lighter right area */}
      <div className="relative z-20 w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
        <div className="glass-morphism-card-light rounded-3xl p-7 sm:p-9 border border-white/90 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Top Glass Reflection Shimmer */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

          {/* Brand Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E3EAF5] shadow-xs mb-3">
              <span className="text-base font-black tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
                L & T
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#016DD9] shadow-[0_0_8px_#016DD9]" />
              <span className="text-xs text-[#64748B] font-semibold">L&D Intelligence</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B4D] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">
              Sign in with your enterprise credentials.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Work email */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider flex items-center justify-between">
                <span>Work Email</span>
                <span className="text-[11px] font-normal text-slate-400 lowercase">@organization</span>
              </label>
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

            {/* Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider flex items-center justify-between">
                <span>Password</span>
                <span className="text-[11px] text-slate-400 font-normal">Encrypted</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="glass-morphism-input-light w-full pl-11 pr-11 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0B1B4D] transition-colors p-1 rounded-lg cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot options */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-[#64748B] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#016DD9] border-slate-300 focus:ring-[#016DD9]/20"
                />
                <span>Remember session</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('For password resets, contact your enterprise L&D administrator.');
                }}
                className="text-[#016DD9] hover:underline font-semibold"
              >
                Forgot password?
              </a>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-shake w-full py-3 sm:py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold text-white bg-[#016DD9] hover:bg-[#005bb8] shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Access Note */}
          <div className="mt-4 text-center text-[11px] text-[#94A3B8]">
            Authenticated via SQLite relational database with bcrypt & JWT RBAC.
          </div>
        </div>
      </div>
    </div>
  );
};
