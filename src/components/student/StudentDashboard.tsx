import { useState, useEffect } from 'react';
import type { Teacher, Chapter, Question } from '../../db/localDb';
import { db } from '../../db/db';
import type { UserSession } from '../../hooks/useAuth';
import { BookOpen, Award, CheckCircle2, XCircle, Search, LogOut, FileText, Play, ChevronRight, User, HelpCircle, RefreshCw, BarChart2 } from 'lucide-react';

interface StudentDashboardProps {
  user: UserSession;
  enroll: (teacherId: string) => Promise<boolean>;
  logout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, enroll, logout }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [teacherChapterCounts, setTeacherChapterCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'learning' | 'history'>('learning');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Chapter Reading state
  const [readingChapter, setReadingChapter] = useState<Chapter | null>(null);
  
  // Quiz State
  const [activeQuizChapter, setActiveQuizChapter] = useState<Chapter | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [quizResult, setQuizResult] = useState<{ scorePercent: number; correctCount: number; totalCount: number } | null>(null);

  // Load data
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const allTeachers = (await db.getTeachers()).filter(t => !t.isSuspended);
      const allChapters = await db.getChapters();
      const nextChapters = user.teacherId ? allChapters.filter((chapter) => chapter.teacherId === user.teacherId) : [];
      const nextHistory = await db.getStudentHistory(user.id);
      const counts = allChapters.reduce<Record<string, number>>((acc, chapter) => {
        acc[chapter.teacherId] = (acc[chapter.teacherId] ?? 0) + 1;
        return acc;
      }, {});

      if (isMounted) {
        setTeachers(allTeachers);
        setChapters(nextChapters);
        setHistory(nextHistory);
        setTeacherChapterCounts(counts);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user.id, user.teacherId]);

  const handleEnroll = async (teacherId: string) => {
    if (await enroll(teacherId)) {
      setChapters(teacherId ? await db.getChaptersByTeacher(teacherId) : []);
      setHistory(await db.getStudentHistory(user.id));
    }
  };

  const startQuiz = async (chapter: Chapter) => {
    const questions = await db.getQuestionsByChapter(chapter.id);
    setActiveQuizChapter(chapter);
    setQuizQuestions(questions);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const handleSelectAnswer = (qId: string, option: 'A' | 'B' | 'C' | 'D') => {
    setQuizAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const submitQuiz = async () => {
    if (!activeQuizChapter) return;
    
    // Check that all questions have answers
    const unanswered = quizQuestions.filter(q => !quizAnswers[q.id]);
    if (unanswered.length > 0) {
      alert("Please answer all questions before submitting.");
      return;
    }

    const submission = quizQuestions.map(q => ({
      questionId: q.id,
      selectedAnswer: quizAnswers[q.id]
    }));

    const result = await db.submitQuizAnswers(user.id, activeQuizChapter.id, submission);
    setQuizResult(result);
  };

  const handleCloseQuiz = async () => {
    setActiveQuizChapter(null);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizResult(null);
    // Refresh chapters & history
    if (user.teacherId) {
      setChapters(await db.getChaptersByTeacher(user.teacherId));
      setHistory(await db.getStudentHistory(user.id));
    }
  };

  const enrolledTeacher = teachers.find(t => t.id === user.teacherId);
  const filteredTeachers = teachers.filter(t => t.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  // Quiz Interface Render
  if (activeQuizChapter) {
    return (
      <div className="min-h-screen bg-slate-950 py-10 px-4">
        <div className="max-w-3xl mx-auto glass-card rounded-3xl overflow-hidden relative border border-slate-800">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="p-6 md:p-8 border-b border-slate-900 flex justify-between items-center bg-slate-900/40">
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">CHAPTER ASSESSMENT</span>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-1">{activeQuizChapter.title}</h2>
            </div>
            {!quizResult && (
              <button 
                onClick={() => { if(confirm("Discard quiz? Progress will be lost.")) void handleCloseQuiz(); }}
                className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl transition"
              >
                Quit Quiz
              </button>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {quizQuestions.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <HelpCircle className="h-12 w-12 text-slate-500 mx-auto" />
                <p className="text-slate-400 text-sm">No questions have been configured for this chapter yet.</p>
                <button onClick={() => { void handleCloseQuiz(); }} className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-semibold">Go Back</button>
              </div>
            ) : !quizResult ? (
              // Quiz Question Listing
              <div className="space-y-8">
                {quizQuestions.map((q, idx) => (
                  <div key={q.id} className="space-y-4 border-b border-slate-900/50 pb-6 last:border-0 last:pb-0">
                    <h3 className="text-base font-semibold text-white flex gap-3">
                      <span className="text-indigo-400 font-bold">Q{idx + 1}.</span>
                      {q.questionText}
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-3 pl-6">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => {
                        const optText = q[`option${opt}` as keyof Question] as string;
                        const isSelected = quizAnswers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectAnswer(q.id, opt)}
                            className={`flex items-start gap-3 p-4 rounded-xl border text-left text-sm transition-all duration-200 ${
                              isSelected 
                                ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                                : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className={`h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {opt}
                            </span>
                            <span>{optText}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => { void submitQuiz(); }}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/15 transition-all flex items-center justify-center gap-2"
                >
                  Submit Assessment
                </button>
              </div>
            ) : (
              // Quiz Result and Immediate Feedback
              <div className="space-y-8">
                <div className="text-center py-8 bg-slate-900/40 border border-slate-900 rounded-3xl space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-1">
                    <Award className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Quiz Completed!</h3>
                  <div className="flex justify-center items-center gap-8 py-3">
                    <div className="text-center">
                      <div className="text-3xl font-extrabold text-indigo-400">{quizResult.scorePercent}%</div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Your Score</div>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-800"></div>
                    <div className="text-center">
                      <div className="text-3xl font-extrabold text-slate-300">{quizResult.correctCount} / {quizResult.totalCount}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Correct Answers</div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs px-6">
                    {quizResult.scorePercent >= 70 ? 'Excellent job! You have demonstrated good comprehension of this chapter.' : 'Consider reviewing the chapter notes and video lessons to improve your grade.'}
                  </p>
                </div>

                {/* Question Breakdown Details */}
                <div className="space-y-6">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Detailed Feedback</h4>
                  {quizQuestions.map((q, idx) => {
                    const studentAns = quizAnswers[q.id];
                    const isCorrect = studentAns === q.correctAnswer;
                    return (
                      <div key={q.id} className={`p-5 rounded-2xl border ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'} space-y-3`}>
                        <div className="flex items-start justify-between gap-4">
                          <h5 className="text-sm font-semibold text-white flex gap-2.5">
                            <span className="text-slate-500 font-bold">{idx + 1}.</span>
                            {q.questionText}
                          </h5>
                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 shrink-0 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                              <XCircle className="h-3 w-3" /> Incorrect
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pl-5">
                          <div className={`p-2.5 rounded-lg border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                            <strong>Your Answer:</strong> ({studentAns}) {q[`option${studentAns}` as keyof Question] as string}
                          </div>
                          {!isCorrect && (
                            <div className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg">
                              <strong>Correct Answer:</strong> ({q.correctAnswer}) {q[`option${q.correctAnswer}` as keyof Question] as string}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => { void handleCloseQuiz(); }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm border border-slate-800 transition"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Teacher Directory Page (If not enrolled)
  if (!user.teacherId) {
    return (
      <div className="min-h-screen bg-slate-950 py-12 px-4 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-6 w-6 text-indigo-400" />
              <span className="font-extrabold text-white text-lg tracking-wide uppercase">AETHER LMS</span>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-3.5 py-2 rounded-xl border border-rose-500/20 transition-all font-semibold"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>

          <div className="text-center py-6 max-w-2xl mx-auto space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Select Your Instructor</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              To begin learning, choose a teacher from the school directory. Your study portal will show only courseworks and assignments provided by your selected teacher.
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-md mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search teachers by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white transition placeholder-slate-500 shadow-md"
            />
          </div>

          {/* Directory Grid */}
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/20 rounded-3xl border border-slate-900 space-y-2">
              <p className="text-slate-400 text-sm">No instructors found matching "{searchTerm}"</p>
              <p className="text-slate-600 text-xs">Register new teacher accounts first via Login toggle or log in as Admin to manage users.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredTeachers.map((t) => (
                <div key={t.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-slate-800 hover:border-slate-700/80 transition-all duration-300 group">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">{t.fullName}</h3>
                        <p className="text-slate-500 text-xs mt-0.5">{t.email}</p>
                      </div>
                    </div>
                    
                    {/* Chapter details */}
                    <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{teacherChapterCounts[t.id] ?? 0} Active Learning Chapters</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { void handleEnroll(t.id); }}
                    className="w-full mt-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/5 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Enroll Under Instructor</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/75 border-b border-slate-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-widest uppercase">Aether</span>
              <span className="text-indigo-400 font-extrabold text-sm ml-0.5 uppercase">LMS</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Student Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-300">{user.fullName}</p>
              <p className="text-[10px] text-slate-500">Enrolled under: {enrolledTeacher?.fullName ?? 'None'}</p>
            </div>
            
            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

            {/* Change Teacher */}
            <button
              onClick={() => { void handleEnroll(''); }} // Clear enrollment
              className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 border border-indigo-500/10 px-3 py-2 rounded-xl transition"
            >
              Change Teacher
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1 text-xs text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-3.5 py-2 rounded-xl border border-rose-500/20 transition-all font-semibold"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Student Welcome & Metrics Banner */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden border border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 relative z-10">
            <h2 className="text-2xl font-bold text-white">Welcome back, {user.fullName}!</h2>
            <p className="text-slate-400 text-xs">Instructor: <span className="text-indigo-400 font-bold">{enrolledTeacher?.fullName}</span> • {enrolledTeacher?.email}</p>
          </div>

          {/* Quick Metrics */}
          <div className="flex gap-4 relative z-10">
            <div className="bg-slate-950/60 border border-slate-900 px-4 py-3 rounded-2xl text-center min-w-24">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Chapters</span>
              <p className="text-xl font-bold text-white mt-0.5">{chapters.length}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 px-4 py-3 rounded-2xl text-center min-w-24">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Completed</span>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">
                {history.filter(h => h.hasTaken).length}
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 px-4 py-3 rounded-2xl text-center min-w-24">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Avg Score</span>
              <p className="text-xl font-bold text-indigo-400 mt-0.5">
                {history.filter(h => h.hasTaken).length > 0 
                  ? `${Math.round(history.filter(h => h.hasTaken).reduce((sum, h) => sum + h.score, 0) / history.filter(h => h.hasTaken).length)}%` 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-900">
          <button
            onClick={() => { setActiveTab('learning'); setReadingChapter(null); }}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'learning'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Learning Center
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <BarChart2 className="h-4 w-4" /> Performance History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'learning' && (
          <div className="grid md:grid-cols-12 gap-6 items-start">
            
            {/* Chapters list */}
            <div className={`${readingChapter ? 'md:col-span-5' : 'md:col-span-12'} space-y-4`}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Course Syllabus</h3>
              
              {chapters.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-3xl space-y-2">
                  <p className="text-slate-500 text-sm">No chapters uploaded by this teacher yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chapters.map((ch) => {
                    const quizStatus = history.find(h => h.chapterId === ch.id);
                    const isReading = readingChapter?.id === ch.id;
                    return (
                      <div
                        key={ch.id}
                        onClick={() => setReadingChapter(ch)}
                        className={`p-4 rounded-2xl cursor-pointer border text-left transition-all duration-300 ${
                          isReading 
                            ? 'bg-indigo-500/10 border-indigo-500/80 shadow-[0_0_12px_rgba(99,102,241,0.08)]'
                            : 'bg-slate-900/40 border-slate-900 hover:border-slate-800 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <h4 className="font-bold text-sm text-white">{ch.title}</h4>
                          {quizStatus?.hasTaken && (
                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                              {quizStatus.score}%
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">{ch.description}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-900/50">
                          <span className="text-[10px] text-slate-500">Created: {new Date(ch.createdAt).toLocaleDateString()}</span>
                          <span className="text-[11px] text-indigo-400 font-semibold flex items-center gap-0.5">
                            View notes <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reading Details Pane */}
            {readingChapter && (
              <div className="md:col-span-7 glass-card rounded-3xl p-6 md:p-8 space-y-6 border border-slate-900 animate-slideUp">
                <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-900">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">CHAPTER NOTES</span>
                    <h3 className="text-xl font-bold text-white mt-1">{readingChapter.title}</h3>
                  </div>
                  <button
                    onClick={() => setReadingChapter(null)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Close
                  </button>
                </div>

                {/* Video Embed */}
                {readingChapter.videoLink && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Play className="h-3 w-3 text-indigo-400" /> Video Lecture</span>
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                      <iframe
                        src={readingChapter.videoLink}
                        title={readingChapter.title}
                        className="absolute inset-0 w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}

                {/* PDF materials mock */}
                {readingChapter.pdfName && (
                  <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-900 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-300">{readingChapter.pdfName}</p>
                        <p className="text-[10px] text-slate-500">Supplementary Material (PDF)</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert(`Simulated download: ${readingChapter.pdfName}`)} 
                      className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition"
                    >
                      Download
                    </button>
                  </div>
                )}

                {/* Text Notes */}
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><FileText className="h-3 w-3 text-indigo-400" /> Study Notes</span>
                  <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl text-xs text-slate-300 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto">
                    {readingChapter.textNotes || "No notes provided for this chapter."}
                  </div>
                </div>

                {/* Launch Assessment */}
                <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
                  <p className="text-xs text-slate-400">
                    Ready to evaluate your knowledge?
                  </p>
                  <button
                    onClick={() => { void startQuiz(readingChapter); }}
                    className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 transition"
                  >
                    Take Chapter Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Completed Assessments</h3>
            
            {history.filter(h => h.hasTaken).length === 0 ? (
              <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-3xl space-y-2">
                <p className="text-slate-500 text-sm">You haven't completed any quizzes yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {history.filter(h => h.hasTaken).map((h) => (
                  <div key={h.chapterId} className="glass-card rounded-2xl p-5 border border-slate-900 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-slate-800 transition">
                    <div>
                      <h4 className="font-bold text-sm text-white">{h.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Submitted: {h.submittedAt ? new Date(h.submittedAt).toLocaleString() : 'N/A'}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Grading Score</span>
                        <span className={`text-xl font-bold ${h.score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {h.score}%
                        </span>
                        <span className="text-slate-400 text-xs ml-1.5">({h.correctCount}/{h.totalQuestions} Correct)</span>
                      </div>

                      <button
                        onClick={() => {
                          const chap = chapters.find(c => c.id === h.chapterId);
                          if (chap) void startQuiz(chap);
                        }}
                        className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 px-3.5 py-2 rounded-xl transition font-semibold"
                      >
                        <RefreshCw className="h-3 w-3" /> Re-take Quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
