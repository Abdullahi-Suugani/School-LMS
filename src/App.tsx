import { useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/auth/AuthScreen';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GraduationCap } from 'lucide-react';

function App() {
  const {
    user,
    loading,
    error,
    login,
    register,
    resetPassword,
    enroll,
    logout,
    setError
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl shadow-indigo-500/10 shadow-lg animate-pulse">
          <GraduationCap className="h-10 w-10 text-white" />
        </div>
        <span className="text-slate-400 text-xs font-semibold tracking-widest uppercase animate-pulse">
          Initializing Portal
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        login={login}
        register={register}
        resetPassword={resetPassword}
        error={error}
        setError={setError}
      />
    );
  }

  // Dashboard routing based on user session role
  switch (user.role) {
    case 'student':
      return (
        <StudentDashboard
          user={user}
          enroll={enroll}
          logout={logout}
        />
      );
    case 'teacher':
      return (
        <TeacherDashboard
          user={user}
          logout={logout}
        />
      );
    case 'admin':
      return (
        <AdminDashboard
          user={user}
          logout={logout}
        />
      );
    default:
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-center px-4">
          <div className="text-rose-500 font-bold">Access Violation</div>
          <p className="text-slate-400 text-xs">The system was unable to establish a secure workspace for this session.</p>
          <button onClick={logout} className="px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs">
            Return to Login
          </button>
        </div>
      );
  }
}

export default App;
