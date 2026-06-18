import { useState, useEffect } from 'react';
import { db } from '../../db/db';
import type { UserSession } from '../../hooks/useAuth';
import { ShieldAlert, LogOut, CheckCircle, Ban, Search } from 'lucide-react';

interface AdminDashboardProps {
  user: UserSession;
  logout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ logout }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'student'>('all');

  const loadData = async () => {
    setMetrics(await db.getAdminMetrics());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSuspension = async (userId: string, role: 'teacher' | 'student', currentStatus: boolean) => {
    const isSuspended = !currentStatus;
    if (role === 'teacher') {
      await db.updateTeacher(userId, { isSuspended });
    } else {
      await db.updateStudent(userId, { isSuspended });
    }
    loadData();
  };

  if (!metrics) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading Platform Data...</div>
      </div>
    );
  }

  // Combine teachers and students for unified list
  const allUsers = [
    ...metrics.teachers.map((t: any) => ({ ...t, role: 'teacher' as const })),
    ...metrics.students.map((s: any) => ({ ...s, role: 'student' as const }))
  ];

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/75 border-b border-slate-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-xl">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-widest uppercase">Aether</span>
              <span className="text-rose-500 font-extrabold text-sm ml-0.5 uppercase">LMS</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Administration</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1 text-xs text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-3.5 py-2 rounded-xl border border-rose-500/20 transition-all font-semibold"
          >
            <LogOut className="h-3.5 w-3.5" /> Log Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Admin Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Teachers</span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-white">{metrics.totalTeachers}</p>
              <span className="text-[10px] text-slate-500">Registered</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Students</span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-white">{metrics.totalStudents}</p>
              <span className="text-[10px] text-slate-500">Enrolled</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Syllabus Chapters</span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-white">{metrics.totalChapters}</p>
              <span className="text-[10px] text-slate-500">Created</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quizzes Submitted</span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-white">{metrics.totalQuizzesTaken}</p>
              <span className="text-[10px] text-slate-500">Completed</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-900 col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Overall Success Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-emerald-400">{metrics.overallSuccessRate}%</p>
              <span className="text-[10px] text-emerald-500/80">Average</span>
            </div>
          </div>
        </div>

        {/* User Moderation Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Account Moderation Panel</h3>
              <p className="text-slate-500 text-xs mt-0.5">Toggle suspension status to manage platform login permissions.</p>
            </div>

            {/* Filter buttons */}
            <div className="flex p-0.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
              {(['all', 'teacher', 'student'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg font-medium capitalize transition ${
                    roleFilter === role
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {role}s
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by user name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-white transition placeholder-slate-600"
            />
          </div>

          {/* Table */}
          <div className="glass-card rounded-2xl border border-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-900/80 text-slate-400 font-bold">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Assigned Info</th>
                    <th className="p-4">Registered Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No registered accounts found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-900/10 transition">
                        <td className="p-4 font-bold text-white">{u.fullName}</td>
                        <td className="p-4 text-slate-400">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'teacher' 
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {u.role === 'teacher' ? (
                            <span>{u.studentCount} Students • {u.chapterCount} Chapters</span>
                          ) : (
                            <span>Enrolled: {u.teacherName}</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          {u.isSuspended ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                              <Ban className="h-3 w-3" /> Suspended
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle className="h-3 w-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => { void handleToggleSuspension(u.id, u.role, u.isSuspended); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                              u.isSuspended 
                                ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}
                          >
                            {u.isSuspended ? 'Activate' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
