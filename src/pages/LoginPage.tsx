import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Shield,
  BarChart3,
  Users
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { api, UserProfile } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen w-full bg-[#E2E8F0] text-[#0B1B4D] flex flex-col font-['Inter',sans-serif] selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar with OwlSure Logo — matching Employee Page header */}
      <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-[#CBD5E1] sticky top-0 z-30 shadow-xs">
        <PageContainer className="h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="OwlSure" className="h-7 sm:h-8 w-auto select-none" />
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-[11px] font-semibold text-[#64748B] tracking-wide uppercase">
              Learning & Development
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
            <span className="text-[10px] font-semibold text-[#059669]">Administration Portal</span>
          </div>
        </PageContainer>
      </header>

      {/* Main Container — Split Screen matching Employee Page */}
      <main className="flex-1 w-full flex flex-col justify-start">
        <div className="flex-1 flex flex-col lg:flex-row">
          
          {/* LEFT — Green Branding Panel (Emerald & Forest Green with flowing waves and OwlSure branding) */}
          <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-[#05241C]">
            {/* Emerald radial glow in top-right */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 75% 30%, rgba(16, 185, 129, 0.40) 0%, rgba(5, 36, 28, 0.25) 65%), linear-gradient(140deg, #041B15 0%, #063527 48%, #0A523E 100%)',
              }}
            />
            {/* Soft glass highlight sheen */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/[0.10] pointer-events-none" />

            {/* Elegant curved wave lines in soft emerald/mint */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 600 800"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M -60 720 C 140 680, 240 480, 400 370 C 500 290, 560 160, 640 40"
                stroke="rgba(110, 231, 183, 0.32)"
                strokeWidth="1.5"
              />
              <path
                d="M -60 780 C 180 740, 290 530, 450 420 C 550 350, 590 220, 640 90"
                stroke="rgba(110, 231, 183, 0.24)"
                strokeWidth="1.2"
              />
              <path
                d="M -60 840 C 220 800, 330 600, 500 480 C 580 410, 620 280, 640 150"
                stroke="rgba(110, 231, 183, 0.16)"
                strokeWidth="1"
              />
            </svg>

            {/* Glowing Emerald Particle Dots / Stars */}
            <div className="absolute top-[18%] right-[30%] w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] pointer-events-none" />
            <div className="absolute top-[32%] right-[14%] w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] pointer-events-none" />
            <div className="absolute top-[44%] right-[42%] w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] pointer-events-none" />
            <div className="absolute top-[58%] right-[22%] w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] pointer-events-none" />
            <div className="absolute top-[14%] right-[54%] w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] pointer-events-none" />
            <div className="absolute top-[68%] left-[28%] w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] pointer-events-none" />

            {/* Content */}
            <div className="relative z-20 flex flex-col justify-between p-10 xl:p-14 w-full h-full">
              {/* Logo */}
              <div>
                <img src="/logo-dark.png" alt="OwlSure" className="h-9 xl:h-10 w-auto select-none" />
                <p className="text-xs text-white/60 mt-2.5 font-medium">A business unit of ValueMomentum</p>
              </div>

              {/* Main Tagline */}
              <div className="space-y-8 -mt-8">
                <div className="space-y-4">
                  <h2 className="text-3xl xl:text-4xl 2xl:text-[2.75rem] font-extrabold text-white leading-tight font-['Plus_Jakarta_Sans',sans-serif]">
                    Enterprise skills,{' '}
                    <span className="text-[#34D399]">intelligence center.</span>
                  </h2>
                  <p className="text-base xl:text-lg text-white/60 max-w-md leading-relaxed">
                    Secure administrative portal for workforce capability tracking, role matrices, and real-time skill analytics.
                  </p>
                </div>

                {/* Feature Highlights */}
                <div className="space-y-4">
                  {[
                    { icon: Shield, text: 'Enterprise-grade role-based access' },
                    { icon: BarChart3, text: 'Real-time capability & deployment metrics' },
                    { icon: Users, text: 'Centralized workforce skill taxonomy' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#34D399]" />
                      </div>
                      <span className="text-sm text-white/75 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="text-xs text-white/30 font-medium">
                &copy; {new Date().getFullYear()} OwlSure &middot; Enterprise Workforce Intelligence
              </div>
            </div>
          </div>

          {/* RIGHT — Admin Credentials Form with Soft Continuing Green Ambient Background */}
          <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative overflow-hidden bg-gradient-to-br from-[#EBF5EF] via-[#F2F8F4] to-[#F8FAF9]">
            {/* Soft ambient green radial glow continuing from the left branding panel */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 75% 70% at 0% 50%, rgba(16, 185, 129, 0.16) 0%, rgba(52, 211, 153, 0.07) 50%, transparent 80%)'
              }}
            />
            {/* Gentle bottom-right ambient accent */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 100% 100%, rgba(5, 150, 105, 0.06) 0%, transparent 60%)'
              }}
            />

            <div className="w-full max-w-md relative z-10">
              {/* Mobile branding (hidden on lg+) */}
              <div className="lg:hidden text-center mb-6">
                <img src="/logo.png" alt="OwlSure" className="h-8 w-auto mx-auto" />
                <p className="text-xs text-[#64748B] mt-1.5">Enterprise Workforce Intelligence</p>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-10 border border-[#CBD5E1]/90 shadow-2xl shadow-emerald-950/10 space-y-6 relative overflow-hidden">
                {/* Top accent line — Vibrant Green Gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#059669] via-[#10B981] to-[#34D399]" />

                <div className="text-center">
                  <img
                    src="/login-logo.png"
                    alt="Admin Portal"
                    className="h-12 sm:h-14 w-auto mx-auto object-contain select-none drop-shadow-md"
                  />
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] mt-2 mb-1">
                    Skill Capture
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    Sign in with your OwlSure credentials
                  </p>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                  {/* Work email */}
                  <div className="space-y-1.5 text-left">
                    <label 
                      htmlFor="user_work_email"
                      className="block text-xs font-bold text-[#0B1B4D] uppercase tracking-wider"
                    >
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        name="user_work_email"
                        id="user_work_email"
                        autoComplete="off"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-medium border border-[#CBD5E1] bg-white text-[#0B1B4D] placeholder-slate-400 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#10B981]/20 transition-all duration-150"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5 text-left">
                    <label 
                      htmlFor="user_work_password"
                      className="block text-xs font-bold text-[#0B1B4D] uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="user_work_password"
                        id="user_work_password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-medium border border-[#CBD5E1] bg-white text-[#0B1B4D] placeholder-slate-400 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#10B981]/20 transition-all duration-150"
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

                  {/* Sign in Button in vibrant Green */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 sm:py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#059669] hover:bg-[#047857] shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-60 cursor-pointer"
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

                {/* Link to Employee Portal */}
                <div className="pt-2 text-center">
                  <a
                    href="/"
                    className="text-xs text-[#64748B] hover:text-[#059669] hover:underline transition-colors font-medium cursor-pointer"
                  >
                    Looking for Employee Skill Profile? Click here &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
