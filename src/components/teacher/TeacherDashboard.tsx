import { useState, useEffect } from 'react';
import type { Chapter, Question } from '../../db/localDb';
import { db } from '../../db/db';
import type { UserSession } from '../../hooks/useAuth';
import { BookOpen, UserCheck, Award, Plus, Trash2, Edit3, X, FileText, Play, Users, BarChart2, Upload } from 'lucide-react';

interface TeacherDashboardProps {
  user: UserSession;
  logout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, logout }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [totalQuestionCount, setTotalQuestionCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'chapters' | 'questions' | 'grades'>('chapters');

  // Chapter CRUD State
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDesc, setChapterDesc] = useState('');
  const [chapterNotes, setChapterNotes] = useState('');
  const [chapterVideo, setChapterVideo] = useState('');
  const [chapterPdf, setChapterPdf] = useState('');
  const [showChapterForm, setShowChapterForm] = useState(false);

  // Question CRUD State
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAns, setCorrectAns] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Load dashboard data
  const loadData = async () => {
    const chs = await db.getChaptersByTeacher(user.id);
    setChapters(chs);
    if (chs.length > 0 && !selectedChapterId) {
      setSelectedChapterId(chs[0].id);
    }
    const grades = await db.getStudentScoresForTeacher(user.id);
    const allQuestions = await db.getQuestions();
    const teacherChapterIds = new Set(chs.map((chapter) => chapter.id));
    const counts = allQuestions.reduce<Record<string, number>>((acc, question) => {
      acc[question.chapterId] = (acc[question.chapterId] ?? 0) + 1;
      return acc;
    }, {});
    setStudentsData(grades);
    setQuestionCounts(counts);
    setTotalQuestionCount(allQuestions.filter((question) => teacherChapterIds.has(question.chapterId)).length);
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  useEffect(() => {
    let isMounted = true;

    const loadQuestions = async () => {
    if (selectedChapterId) {
        const chapterQuestions = await db.getQuestionsByChapter(selectedChapterId);
        if (isMounted) setQuestions(chapterQuestions);
    } else {
        setQuestions([]);
    }
    };

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [selectedChapterId]);

  // --- CHAPTER ACTIONS ---
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle || !chapterDesc) return;

    if (editingChapterId) {
      await db.updateChapter(editingChapterId, {
        title: chapterTitle,
        description: chapterDesc,
        textNotes: chapterNotes,
        videoLink: chapterVideo,
        pdfName: chapterPdf || undefined
      });
      setEditingChapterId(null);
    } else {
      await db.addChapter({
        teacherId: user.id,
        title: chapterTitle,
        description: chapterDesc,
        textNotes: chapterNotes,
        videoLink: chapterVideo,
        pdfName: chapterPdf || undefined
      });
    }

    // Reset Form
    setChapterTitle('');
    setChapterDesc('');
    setChapterNotes('');
    setChapterVideo('');
    setChapterPdf('');
    setShowChapterForm(false);
    loadData();
  };

  const handleEditChapterClick = (ch: Chapter) => {
    setEditingChapterId(ch.id);
    setChapterTitle(ch.title);
    setChapterDesc(ch.description);
    setChapterNotes(ch.textNotes || '');
    setChapterVideo(ch.videoLink || '');
    setChapterPdf(ch.pdfName || '');
    setShowChapterForm(true);
  };

  const handleChapterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setChapterPdf(file?.name ?? '');
  };

  const handleDeleteChapterClick = async (id: string) => {
    if (confirm("Delete this chapter? This will permanently delete all associated MCQs and student results.")) {
      await db.deleteChapter(id);
      if (selectedChapterId === id) {
        setSelectedChapterId('');
      }
      loadData();
    }
  };

  // --- QUESTION ACTIONS ---
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapterId || !questionText || !optA || !optB || !optC || !optD) return;

    const questionPayload = {
      chapterId: selectedChapterId,
      questionText,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: correctAns
    };

    if (editingQuestionId) {
      await db.updateQuestion(editingQuestionId, questionPayload);
      setEditingQuestionId(null);
    } else {
      await db.addQuestion(questionPayload);
    }

    // Reset Form
    setQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectAns('A');
    setShowQuestionForm(false);
    setQuestions(await db.getQuestionsByChapter(selectedChapterId));
    loadData();
  };

  const handleEditQuestionClick = (q: Question) => {
    setEditingQuestionId(q.id);
    setQuestionText(q.questionText);
    setOptA(q.optionA);
    setOptB(q.optionB);
    setOptC(q.optionC);
    setOptD(q.optionD);
    setCorrectAns(q.correctAnswer);
    setShowQuestionForm(true);
  };

  const handleDeleteQuestionClick = async (id: string) => {
    if (confirm("Delete this question? This will also remove any student submissions for this specific question.")) {
      await db.deleteQuestion(id);
      setQuestions(await db.getQuestionsByChapter(selectedChapterId));
      loadData();
    }
  };

  // Calculate Metrics
  const enrolledStudents = studentsData.length;
  const activeChapters = chapters.length;
  
  // Calculate average score
  const studentAverages = studentsData.map(s => s.avgScore).filter(score => score !== null) as number[];
  const averageQuizScore = studentAverages.length > 0 
    ? Math.round(studentAverages.reduce((sum, score) => sum + score, 0) / studentAverages.length)
    : null;

  return (
    <div className="min-h-screen bg-slate-950">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/75 border-b border-slate-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-xl">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-widest uppercase">Aether</span>
              <span className="text-purple-400 font-extrabold text-sm ml-0.5 uppercase">LMS</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Teacher Console</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-300">{user.fullName}</p>
              <p className="text-[10px] text-slate-500">Subject Instructor</p>
            </div>
            
            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>

            <button
              onClick={logout}
              className="flex items-center gap-1 text-xs text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 px-3.5 py-2 rounded-xl border border-rose-500/20 transition-all font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Instructor Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-900">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Students</span>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{enrolledStudents}</p>
            <p className="text-[10px] text-slate-500 mt-1">Enrolled under your code</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-900">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chapters</span>
              <BookOpen className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{activeChapters}</p>
            <p className="text-[10px] text-slate-500 mt-1">Active study materials</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-900">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">MCQ Count</span>
              <BarChart2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {totalQuestionCount}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Total quiz questions</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-900">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Grade</span>
              <Award className="h-4 w-4 text-pink-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{averageQuizScore !== null ? `${averageQuizScore}%` : 'N/A'}</p>
            <p className="text-[10px] text-slate-500 mt-1">Class average score</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-900">
          <button
            onClick={() => setActiveTab('chapters')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'chapters'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Chapters
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'questions'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Plus className="h-4 w-4" /> Assessment Designer
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'grades'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <UserCheck className="h-4 w-4" /> Student Grades
          </button>
        </div>

        {/* --- CHAPTERS TAB --- */}
        {activeTab === 'chapters' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Chapters Manager</h3>
              {!showChapterForm && (
                <button
                  onClick={() => {
                    setEditingChapterId(null);
                    setChapterTitle('');
                    setChapterDesc('');
                    setChapterNotes('');
                    setChapterVideo('');
                    setChapterPdf('');
                    setShowChapterForm(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New Chapter
                </button>
              )}
            </div>

            {/* Add/Edit Form */}
            {showChapterForm && (
              <form onSubmit={handleSaveChapter} className="glass-card rounded-3xl p-6 border border-slate-900 space-y-4 animate-slideDown">
                <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                  <h4 className="font-bold text-sm text-white">
                    {editingChapterId ? 'Modify Study Chapter' : 'Create New Study Chapter'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowChapterForm(false)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Chapter Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chemical Nomenclature"
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-white transition placeholder-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Video Lesson Link (YouTube embed URL)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://www.youtube.com/embed/vbwyWRurF1I"
                      value={chapterVideo}
                      onChange={(e) => setChapterVideo(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-white transition placeholder-slate-600"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Chapter Short Description</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Write a brief overview..."
                      value={chapterDesc}
                      onChange={(e) => setChapterDesc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-white transition placeholder-slate-600 resize-none"
                    ></textarea>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Supplementary Material</label>
                    <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800 bg-slate-950/60 px-4 py-4 text-center transition hover:border-purple-500/70 hover:bg-slate-950">
                      <Upload className="h-5 w-5 text-purple-400" />
                      <span className="text-xs font-semibold text-slate-300">
                        {chapterPdf || 'Upload PDF from Desktop'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        PDF, DOC, PPT, or text notes
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                        onChange={handleChapterFileChange}
                        className="hidden"
                      />
                    </label>
                    {chapterPdf && (
                      <button
                        type="button"
                        onClick={() => setChapterPdf('')}
                        className="text-[10px] font-semibold text-rose-400 hover:text-rose-300"
                      >
                        Remove selected file
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Study Text / Lecture Notes (Markdown/Text)</label>
                  <textarea
                    rows={6}
                    placeholder="Write detailed notes for students..."
                    value={chapterNotes}
                    onChange={(e) => setChapterNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-white transition placeholder-slate-600"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowChapterForm(false)}
                    className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
                  >
                    {editingChapterId ? 'Update Chapter' : 'Create Chapter'}
                  </button>
                </div>
              </form>
            )}

            {/* Chapters Grid */}
            {chapters.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-3xl space-y-2">
                <p className="text-slate-500 text-sm">You haven't created any chapters yet.</p>
                <p className="text-[11px] text-slate-600">Click "Add New Chapter" to get started.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {chapters.map((ch) => (
                  <div key={ch.id} className="glass-card rounded-2xl p-5 border border-slate-900 flex flex-col justify-between hover:border-slate-800 transition">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <h4 className="font-bold text-sm text-white">{ch.title}</h4>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditChapterClick(ch)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-purple-400 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteChapterClick(ch.id)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{ch.description}</p>
                      
                      {/* Attachments preview */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {ch.videoLink && (
                          <span className="flex items-center gap-1 text-[10px] bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 px-2 py-0.5 rounded-full">
                            <Play className="h-3 w-3" /> Lecture Video
                          </span>
                        )}
                        {ch.pdfName && (
                          <span className="flex items-center gap-1 text-[10px] bg-purple-500/10 border border-purple-500/25 text-purple-400 px-2 py-0.5 rounded-full">
                            <FileText className="h-3 w-3" /> {ch.pdfName}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full">
                          {questionCounts[ch.id] ?? 0} MCQs
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-900/50 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Created: {new Date(ch.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- ASSESSMENT DESIGNER TAB --- */}
        {activeTab === 'questions' && (
          <div className="grid md:grid-cols-12 gap-6 items-start">
            
            {/* Chapter Selection Panel */}
            <div className="md:col-span-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Chapter</h3>
              {chapters.length === 0 ? (
                <p className="text-xs text-slate-500">Please create a chapter first to configure assessments.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {chapters.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setSelectedChapterId(ch.id);
                        setEditingQuestionId(null);
                        setShowQuestionForm(false);
                      }}
                      className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                        selectedChapterId === ch.id
                          ? 'bg-purple-500/10 border-purple-500/80 text-white'
                          : 'bg-slate-900/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="truncate pr-2">{ch.title}</span>
                        <span className="text-[10px] shrink-0 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-900">
                          {questionCounts[ch.id] ?? 0} MCQs
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Questions CRUD Panel */}
            <div className="md:col-span-8 space-y-4">
              {selectedChapterId ? (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                      MCQ Designer ({chapters.find(c => c.id === selectedChapterId)?.title})
                    </h3>
                    {!showQuestionForm && (
                      <button
                        onClick={() => {
                          setEditingQuestionId(null);
                          setQuestionText('');
                          setOptA('');
                          setOptB('');
                          setOptC('');
                          setOptD('');
                          setCorrectAns('A');
                          setShowQuestionForm(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1 shadow-md"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add MCQ
                      </button>
                    )}
                  </div>

                  {/* MCQ Add/Edit Form */}
                  {showQuestionForm && (
                    <form onSubmit={handleSaveQuestion} className="glass-card rounded-2xl p-5 border border-slate-900 space-y-4 animate-slideDown">
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-900">
                        <h4 className="font-bold text-xs text-white">
                          {editingQuestionId ? 'Edit Multiple Choice Question' : 'Create Multiple Choice Question'}
                        </h4>
                        <button type="button" onClick={() => setShowQuestionForm(false)} className="text-slate-500">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Question Text</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Which of the following is an inert gas?"
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-white transition placeholder-slate-600"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400">Option A</label>
                          <input
                            type="text"
                            required
                            placeholder="Option A text"
                            value={optA}
                            onChange={(e) => setOptA(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs focus:border-purple-500 outline-none text-white transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400">Option B</label>
                          <input
                            type="text"
                            required
                            placeholder="Option B text"
                            value={optB}
                            onChange={(e) => setOptB(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs focus:border-purple-500 outline-none text-white transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400">Option C</label>
                          <input
                            type="text"
                            required
                            placeholder="Option C text"
                            value={optC}
                            onChange={(e) => setOptC(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs focus:border-purple-500 outline-none text-white transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400">Option D</label>
                          <input
                            type="text"
                            required
                            placeholder="Option D text"
                            value={optD}
                            onChange={(e) => setOptD(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs focus:border-purple-500 outline-none text-white transition"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 w-1/3">
                        <label className="text-xs font-medium text-slate-300">Designate Correct Answer</label>
                        <select
                          value={correctAns}
                          onChange={(e) => setCorrectAns(e.target.value as 'A' | 'B' | 'C' | 'D')}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-purple-500 outline-none"
                        >
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowQuestionForm(false)}
                          className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-md transition"
                        >
                          {editingQuestionId ? 'Update MCQ' : 'Create MCQ'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Questions List */}
                  {questions.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-3xl space-y-2">
                      <p className="text-slate-500 text-sm">No MCQs have been created for this chapter.</p>
                      <p className="text-[11px] text-slate-600">Click "Add MCQ" to design questions.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((q, idx) => (
                        <div key={q.id} className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-3 relative group">
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="font-bold text-sm text-white flex gap-2.5">
                              <span className="text-purple-400">Q{idx + 1}.</span>
                              {q.questionText}
                            </h4>
                            <div className="flex gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditQuestionClick(q)}
                                className="p-1.5 bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-purple-400 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestionClick(q.id)}
                                className="p-1.5 bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-2 text-xs pl-5">
                            <div className={`p-2 rounded-lg border ${q.correctAnswer === 'A' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium' : 'bg-slate-950/40 border-slate-900 text-slate-400'}`}>
                              A. {q.optionA}
                            </div>
                            <div className={`p-2 rounded-lg border ${q.correctAnswer === 'B' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium' : 'bg-slate-950/40 border-slate-900 text-slate-400'}`}>
                              B. {q.optionB}
                            </div>
                            <div className={`p-2 rounded-lg border ${q.correctAnswer === 'C' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium' : 'bg-slate-950/40 border-slate-900 text-slate-400'}`}>
                              C. {q.optionC}
                            </div>
                            <div className={`p-2 rounded-lg border ${q.correctAnswer === 'D' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium' : 'bg-slate-950/40 border-slate-900 text-slate-400'}`}>
                              D. {q.optionD}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-3xl">
                  <p className="text-slate-500 text-sm">Select a chapter from the left panel to configure its quiz questions.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- STUDENT GRADES TRACKER TAB --- */}
        {activeTab === 'grades' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Student Grade Book</h3>
            
            {studentsData.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/10 border border-slate-900 rounded-3xl space-y-2">
                <p className="text-slate-500 text-sm">No students have enrolled under you yet.</p>
                <p className="text-[11px] text-slate-600">Students can select you as their teacher from their dashboard directory.</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-slate-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-900/80 text-slate-400 font-bold">
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Email Address</th>
                        {chapters.map(ch => (
                          <th key={ch.id} className="p-4 min-w-32">{ch.title}</th>
                        ))}
                        <th className="p-4 text-right">Average Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {studentsData.map(st => (
                        <tr key={st.studentId} className="hover:bg-slate-900/25 transition">
                          <td className="p-4 font-bold text-white flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-[10px] font-bold">
                              {st.fullName[0]}
                            </span>
                            {st.fullName}
                            {st.isSuspended && (
                              <span className="text-[9px] bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/25 shrink-0">Suspended</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-500">{st.email}</td>
                          
                          {/* Render scores for each chapter */}
                          {chapters.map(ch => {
                            const grade = st.chapterGrades.find((cg: any) => cg.chapterId === ch.id);
                            return (
                              <td key={ch.id} className="p-4">
                                {grade && grade.hasTaken ? (
                                  <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                                    grade.score >= 70 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {grade.score}%
                                  </span>
                                ) : (
                                  <span className="text-slate-600 font-medium italic">Not Taken</span>
                                )}
                              </td>
                            );
                          })}

                          <td className="p-4 text-right font-bold text-sm">
                            {st.avgScore !== null ? (
                              <span className={st.avgScore >= 70 ? 'text-indigo-400' : 'text-amber-400'}>
                                {st.avgScore}%
                              </span>
                            ) : (
                              <span className="text-slate-600 font-medium italic text-xs">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
