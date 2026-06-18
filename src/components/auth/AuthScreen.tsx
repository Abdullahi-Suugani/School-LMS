import { useState } from 'react';
import type { UserRole } from '../../hooks/useAuth';
import { GraduationCap, BookOpen, KeyRound, Mail, User, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (fullName: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  resetPassword: (email: string, newPass: string, role: UserRole) => Promise<boolean>;
  error: string | null;
  setError: (err: string | null) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  login,
  register,
  resetPassword,
  error,
  setError
}) => {
  const [activeTab, setActiveTab] = useState<UserRole>('student');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password, activeTab);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
        const success = await register(fullName, email, password, activeTab);
        if (success) {
          setMessage("Account created successfully!");
          setMode('login');
        }
      } else if (mode === 'forgot') {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
        const success = await resetPassword(email, password, activeTab);
        if (success) {
          setMessage("Password updated successfully! You can now log in.");
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Database request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    setError(null);
    setMessage(null);
    setActiveTab(role);
    setMode('login');
    if (role === 'admin') {
      setEmail('admin@lms.com');
      setPassword('admin123');
    } else if (role === 'teacher') {
      setEmail('teacher@lms.com');
      setPassword('password123');
    } else {
      setEmail('student@lms.com');
      setPassword('password123');
    }
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setError(null);
    setMessage(null);
    setMode(newMode);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Brand and Info */}
        <div className="md:col-span-5 text-left space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl shadow-indigo-500/25 shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">AETHER</span>
              <span className="text-xl font-extrabold text-indigo-500 tracking-tight ml-1">LMS</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Smarter Learning, <br/>
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Simpler Teaching.</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Empower your school with interactive chapter management, immediate quiz grading, and rich performance diagnostics all under one roof.
            </p>
          </div>

          {/* Quick Demo Login Cards */}
          <div className="space-y-3 pt-4 border-t border-slate-900">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Demo Login</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDemoLogin('student')}
                className="flex flex-col items-center p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl hover:border-indigo-500/50 hover:bg-slate-900 transition text-center group"
              >
                <User className="h-4 w-4 text-indigo-400 mb-1 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-300">Student</span>
                <span className="text-[10px] text-slate-500">Alex</span>
              </button>
              <button
                onClick={() => handleDemoLogin('teacher')}
                className="flex flex-col items-center p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl hover:border-purple-500/50 hover:bg-slate-900 transition text-center group"
              >
                <BookOpen className="h-4 w-4 text-purple-400 mb-1 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-300">Teacher</span>
                <span className="text-[10px] text-slate-500">Sarah</span>
              </button>
              <button
                onClick={() => handleDemoLogin('admin')}
                className="flex flex-col items-center p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl hover:border-pink-500/50 hover:bg-slate-900 transition text-center group"
              >
                <KeyRound className="h-4 w-4 text-pink-400 mb-1 group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-slate-300">Admin</span>
                <span className="text-[10px] text-slate-500">Full Access</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <div className="md:col-span-7">
          <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden">
            {/* Form Role Tabs */}
            <div className="flex p-1 bg-slate-950/80 border border-slate-800/50 rounded-2xl mb-6">
              {(['student', 'teacher', 'admin'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setActiveTab(role);
                    if (role === 'admin' && mode === 'register') {
                      setMode('login'); // Admin cannot register
                    }
                  }}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-xl capitalize transition-all duration-300 ${
                    activeTab === role
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl mb-4 text-xs animate-shake">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl mb-4 text-xs">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            {/* Form Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white capitalize">
                {mode === 'login' && `Log In as ${activeTab}`}
                {mode === 'register' && `Register as ${activeTab}`}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {mode === 'login' && 'Provide your credentials to access your portal.'}
                {mode === 'register' && 'Enter details below to open a new account.'}
                {mode === 'forgot' && 'Provide your email to update your account password.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white transition placeholder-slate-600"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white transition placeholder-slate-600"
                />
              </div>

              {(mode === 'login') && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-slate-400" /> Password
                    </label>
                    {activeTab !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white transition placeholder-slate-600"
                  />
                </div>
              )}

              {(mode === 'forgot' || mode === 'register') && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-slate-400" /> 
                      {mode === 'forgot' ? 'New Password' : 'Password'}
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white transition placeholder-slate-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-slate-400" /> Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white transition placeholder-slate-600"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
              >
                <span>
                  {submitting && 'Working...'}
                  {!submitting && mode === 'login' && 'Log In'}
                  {!submitting && mode === 'register' && 'Register Account'}
                  {!submitting && mode === 'forgot' && 'Save New Password'}
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Footer switcher */}
            <div className="mt-6 text-center border-t border-slate-900 pt-4">
              {mode === 'login' ? (
                activeTab !== 'admin' && (
                  <p className="text-slate-400 text-xs">
                    Don't have an account?{' '}
                    <button
                      onClick={() => switchMode('register')}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
                    >
                      Sign up
                    </button>
                  </p>
                )
              ) : (
                <p className="text-slate-400 text-xs">
                  Already have an account?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
                  >
                    Log in
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
