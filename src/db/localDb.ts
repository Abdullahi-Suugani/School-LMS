// Simulated Relational Database in localStorage
// Matches the Entity-Relationship schema in Section 6 of the SRS

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string; // For mock purposes, plain text or simple hash
  isSuspended: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  teacherId?: string; // Foreign Key -> Teacher.id
  isSuspended: boolean;
  createdAt: string;
}

export interface Chapter {
  id: string;
  teacherId: string; // Foreign Key -> Teacher.id
  title: string;
  description: string;
  textNotes?: string;
  videoLink?: string;
  pdfName?: string;
  createdAt: string;
}

export interface Question {
  id: string;
  chapterId: string; // Foreign Key -> Chapter.id
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface Result {
  id: string;
  studentId: string; // Foreign Key -> Student.id
  questionId: string; // Foreign Key -> Question.id
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  submittedAt: string;
}

// Database keys
const KEYS = {
  TEACHERS: 'lms_teachers',
  STUDENTS: 'lms_students',
  CHAPTERS: 'lms_chapters',
  QUESTIONS: 'lms_questions',
  RESULTS: 'lms_results',
  SESSION: 'lms_session'
};

// Helper functions for localStorage
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Pre-populated Mock Data
const MOCK_TEACHERS: Teacher[] = [
  {
    id: 't-1',
    fullName: 'Dr. Sarah Jenkins',
    email: 'teacher@lms.com',
    passwordHash: 'password123',
    isSuspended: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  },
  {
    id: 't-2',
    fullName: 'Prof. Marcus Vance',
    email: 'marcus@lms.com',
    passwordHash: 'password123',
    isSuspended: false,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_STUDENTS: Student[] = [
  {
    id: 's-1',
    fullName: 'Alex Rivera',
    email: 'student@lms.com',
    passwordHash: 'password123',
    teacherId: 't-1', // Enrolled under Dr. Jenkins
    isSuspended: false,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 's-2',
    fullName: 'Emily Chen',
    email: 'emily@lms.com',
    passwordHash: 'password123',
    teacherId: 't-1', // Enrolled under Dr. Jenkins
    isSuspended: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 's-3',
    fullName: 'Liam Johnson',
    email: 'liam@lms.com',
    passwordHash: 'password123',
    teacherId: 't-2', // Enrolled under Prof. Vance
    isSuspended: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 's-4',
    fullName: 'Zoe Martinez',
    email: 'zoe@lms.com',
    passwordHash: 'password123',
    teacherId: undefined, // Unenrolled student
    isSuspended: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_CHAPTERS: Chapter[] = [
  {
    id: 'c-1',
    teacherId: 't-1',
    title: 'Introduction to Quantum Mechanics',
    description: 'Explore the fundamental concepts of quantum mechanics, including wave-particle duality, the Schrodinger equation, and quantum tunneling.',
    textNotes: 'Quantum mechanics is a fundamental theory in physics that describes the physical properties of nature at the scale of atoms and subatomic particles. Unlike classical mechanics, which is deterministic, quantum mechanics relies on probabilities. Key concepts include:\n\n1. Wave-Particle Duality: Matter and light exhibit both wave-like and particle-like properties.\n2. Quantization of Energy: Energy is not continuous, but exists in discrete packets called quanta.\n3. The Uncertainty Principle: Formulated by Werner Heisenberg, it states that we cannot simultaneously know the exact position and momentum of a particle with absolute precision.\n\nRead chapters 1-3 in the primary textbook for a thorough mathematical formulation.',
    videoLink: 'https://www.youtube.com/embed/UsU191fOqSg',
    pdfName: 'quantum_mechanics_syllabus.pdf',
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'c-2',
    teacherId: 't-1',
    title: 'The Photoelectric Effect',
    description: 'Understand how light knocks electrons free from metal surfaces and how Einstein explained this using Planck\'s quantum hypothesis.',
    textNotes: 'The Photoelectric Effect is the emission of electrons when electromagnetic radiation, such as light, hits a material. Electrons emitted in this manner are called photoelectrons.\n\nKey observations that classical physics failed to explain:\n1. No electrons are emitted if the incident light frequency is below a threshold frequency, regardless of intensity.\n2. The maximum kinetic energy of emitted photoelectrons depends on the frequency of light, not its intensity.\n3. Electrons are emitted almost instantaneously once light strikes the surface.\n\nAlbert Einstein solved this in 1905 by proposing that light consists of packets of energy called photons (E = hf).',
    videoLink: 'https://www.youtube.com/embed/vbwyWRurF1I',
    pdfName: 'photoelectric_experiment_guide.pdf',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'c-3',
    teacherId: 't-2',
    title: 'Basic Organic Chemistry',
    description: 'An overview of carbon compounds, naming conventions, functional groups, and basic chemical reactions in organic synthesis.',
    textNotes: 'Carbon is unique due to its tetravalency and catenation properties, allowing it to form stable chains and rings. This chapter covers alkanes, alkenes, alkynes, and functional groups like alcohols, aldehydes, and carboxylic acids.',
    videoLink: 'https://www.youtube.com/embed/U3f85vKz09g',
    pdfName: 'organic_chemistry_nomenclature.pdf',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_QUESTIONS: Question[] = [
  // Questions for c-1 (Quantum Mechanics)
  {
    id: 'q-1',
    chapterId: 'c-1',
    questionText: 'Who formulated the famous Uncertainty Principle in Quantum Mechanics?',
    optionA: 'Albert Einstein',
    optionB: 'Werner Heisenberg',
    optionC: 'Erwin Schrödinger',
    optionD: 'Niels Bohr',
    correctAnswer: 'B'
  },
  {
    id: 'q-2',
    chapterId: 'c-1',
    questionText: 'What represents the state of a quantum system mathematically?',
    optionA: 'Velocity Vector',
    optionB: 'Force Operator',
    optionC: 'Wave Function (Psi)',
    optionD: 'Electric Constant',
    correctAnswer: 'C'
  },
  {
    id: 'q-3',
    chapterId: 'c-1',
    questionText: 'Which equation is fundamental to non-relativistic quantum mechanics?',
    optionA: 'Maxwell\'s Equations',
    optionB: 'Einstein\'s Field Equations',
    optionC: 'Schrödinger Equation',
    optionD: 'Dirac Equation',
    correctAnswer: 'C'
  },
  // Questions for c-2 (Photoelectric Effect)
  {
    id: 'q-4',
    chapterId: 'c-2',
    questionText: 'According to Einstein, what is a packet of light energy called?',
    optionA: 'Electron',
    optionB: 'Proton',
    optionC: 'Photon',
    optionD: 'Neutron',
    correctAnswer: 'C'
  },
  {
    id: 'q-5',
    chapterId: 'c-2',
    questionText: 'The kinetic energy of photoelectrons depends on which property of the incident light?',
    optionA: 'Intensity',
    optionB: 'Frequency',
    optionC: 'Amplitude',
    optionD: 'Polarization',
    correctAnswer: 'B'
  }
];

const MOCK_RESULTS: Result[] = [
  // Alex (s-1) took quantum mechanics (c-1). Got 2/3 correct.
  {
    id: 'r-1',
    studentId: 's-1',
    questionId: 'q-1',
    selectedAnswer: 'B', // Correct
    isCorrect: true,
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'r-2',
    studentId: 's-1',
    questionId: 'q-2',
    selectedAnswer: 'C', // Correct
    isCorrect: true,
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'r-3',
    studentId: 's-1',
    questionId: 'q-3',
    selectedAnswer: 'A', // Incorrect (correct is C)
    isCorrect: false,
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },

  // Emily (s-2) took quantum mechanics (c-1). Got 3/3 correct.
  {
    id: 'r-4',
    studentId: 's-2',
    questionId: 'q-1',
    selectedAnswer: 'B', // Correct
    isCorrect: true,
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'r-5',
    studentId: 's-2',
    questionId: 'q-2',
    selectedAnswer: 'C', // Correct
    isCorrect: true,
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'r-6',
    studentId: 's-2',
    questionId: 'q-3',
    selectedAnswer: 'C', // Correct
    isCorrect: true,
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },

  // Alex (s-1) took photoelectric effect (c-2). Got 2/2 correct.
  {
    id: 'r-7',
    studentId: 's-1',
    questionId: 'q-4',
    selectedAnswer: 'C', // Correct
    isCorrect: true,
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'r-8',
    studentId: 's-1',
    questionId: 'q-5',
    selectedAnswer: 'B', // Correct
    isCorrect: true,
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Initialize DB in localStorage if empty
export const initDb = (): void => {
  if (!localStorage.getItem(KEYS.TEACHERS)) {
    setStorageItem(KEYS.TEACHERS, MOCK_TEACHERS);
  }
  if (!localStorage.getItem(KEYS.STUDENTS)) {
    setStorageItem(KEYS.STUDENTS, MOCK_STUDENTS);
  }
  if (!localStorage.getItem(KEYS.CHAPTERS)) {
    setStorageItem(KEYS.CHAPTERS, MOCK_CHAPTERS);
  }
  if (!localStorage.getItem(KEYS.QUESTIONS)) {
    setStorageItem(KEYS.QUESTIONS, MOCK_QUESTIONS);
  }
  if (!localStorage.getItem(KEYS.RESULTS)) {
    setStorageItem(KEYS.RESULTS, MOCK_RESULTS);
  }
};

// Relational Operations Helper Class
export const localDb = {
  // --- TEACHERS ---
  getTeachers: (): Teacher[] => {
    initDb();
    return getStorageItem<Teacher[]>(KEYS.TEACHERS, []);
  },
  getTeacher: (id: string): Teacher | undefined => {
    return localDb.getTeachers().find(t => t.id === id);
  },
  addTeacher: (teacher: Omit<Teacher, 'id' | 'isSuspended' | 'createdAt'>): Teacher => {
    const teachers = localDb.getTeachers();
    const newTeacher: Teacher = {
      ...teacher,
      id: `t-${Date.now()}`,
      isSuspended: false,
      createdAt: new Date().toISOString()
    };
    teachers.push(newTeacher);
    setStorageItem(KEYS.TEACHERS, teachers);
    return newTeacher;
  },
  updateTeacher: (id: string, updates: Partial<Teacher>): Teacher | undefined => {
    const teachers = localDb.getTeachers();
    const index = teachers.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    teachers[index] = { ...teachers[index], ...updates };
    setStorageItem(KEYS.TEACHERS, teachers);
    return teachers[index];
  },

  // --- STUDENTS ---
  getStudents: (): Student[] => {
    initDb();
    return getStorageItem<Student[]>(KEYS.STUDENTS, []);
  },
  getStudent: (id: string): Student | undefined => {
    return localDb.getStudents().find(s => s.id === id);
  },
  addStudent: (student: Omit<Student, 'id' | 'isSuspended' | 'createdAt'>): Student => {
    const students = localDb.getStudents();
    const newStudent: Student = {
      ...student,
      id: `s-${Date.now()}`,
      isSuspended: false,
      createdAt: new Date().toISOString()
    };
    students.push(newStudent);
    setStorageItem(KEYS.STUDENTS, students);
    return newStudent;
  },
  updateStudent: (id: string, updates: Partial<Student>): Student | undefined => {
    const students = localDb.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    students[index] = { ...students[index], ...updates };
    setStorageItem(KEYS.STUDENTS, students);
    return students[index];
  },
  enrollStudent: (studentId: string, teacherId: string): boolean => {
    const student = localDb.getStudent(studentId);
    if (!student) return false;
    localDb.updateStudent(studentId, { teacherId });
    return true;
  },

  // --- CHAPTERS ---
  getChapters: (): Chapter[] => {
    initDb();
    return getStorageItem<Chapter[]>(KEYS.CHAPTERS, []);
  },
  getChaptersByTeacher: (teacherId: string): Chapter[] => {
    return localDb.getChapters().filter(c => c.teacherId === teacherId);
  },
  getChapter: (id: string): Chapter | undefined => {
    return localDb.getChapters().find(c => c.id === id);
  },
  addChapter: (chapter: Omit<Chapter, 'id' | 'createdAt'>): Chapter => {
    const chapters = localDb.getChapters();
    const newChapter: Chapter = {
      ...chapter,
      id: `c-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    chapters.push(newChapter);
    setStorageItem(KEYS.CHAPTERS, chapters);
    return newChapter;
  },
  updateChapter: (id: string, updates: Partial<Omit<Chapter, 'id' | 'teacherId' | 'createdAt'>>): Chapter | undefined => {
    const chapters = localDb.getChapters();
    const index = chapters.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    chapters[index] = { ...chapters[index], ...updates };
    setStorageItem(KEYS.CHAPTERS, chapters);
    return chapters[index];
  },
  deleteChapter: (id: string): boolean => {
    const chapters = localDb.getChapters();
    const filtered = chapters.filter(c => c.id !== id);
    if (filtered.length === chapters.length) return false;
    setStorageItem(KEYS.CHAPTERS, filtered);

    // Relational Cascade: Delete questions linked to this chapter
    const questions = localDb.getQuestions();
    const chapterQuestions = questions.filter(q => q.chapterId === id);
    const filteredQuestions = questions.filter(q => q.chapterId !== id);
    setStorageItem(KEYS.QUESTIONS, filteredQuestions);

    // Relational Cascade: Delete results linked to those questions
    const results = localDb.getResults();
    const questionIds = new Set(chapterQuestions.map(q => q.id));
    const filteredResults = results.filter(r => !questionIds.has(r.questionId));
    setStorageItem(KEYS.RESULTS, filteredResults);

    return true;
  },

  // --- QUESTIONS ---
  getQuestions: (): Question[] => {
    initDb();
    return getStorageItem<Question[]>(KEYS.QUESTIONS, []);
  },
  getQuestionsByChapter: (chapterId: string): Question[] => {
    return localDb.getQuestions().filter(q => q.chapterId === chapterId);
  },
  getQuestion: (id: string): Question | undefined => {
    return localDb.getQuestions().find(q => q.id === id);
  },
  addQuestion: (question: Omit<Question, 'id'>): Question => {
    const questions = localDb.getQuestions();
    const newQuestion: Question = {
      ...question,
      id: `q-${Date.now()}`
    };
    questions.push(newQuestion);
    setStorageItem(KEYS.QUESTIONS, questions);
    return newQuestion;
  },
  updateQuestion: (id: string, updates: Partial<Omit<Question, 'id' | 'chapterId'>>): Question | undefined => {
    const questions = localDb.getQuestions();
    const index = questions.findIndex(q => q.id === id);
    if (index === -1) return undefined;
    questions[index] = { ...questions[index], ...updates };
    setStorageItem(KEYS.QUESTIONS, questions);
    return questions[index];
  },
  deleteQuestion: (id: string): boolean => {
    const questions = localDb.getQuestions();
    const filtered = questions.filter(q => q.id !== id);
    if (filtered.length === questions.length) return false;
    setStorageItem(KEYS.QUESTIONS, filtered);

    // Relational Cascade: Delete results linked to this question
    const results = localDb.getResults();
    const filteredResults = results.filter(r => r.questionId !== id);
    setStorageItem(KEYS.RESULTS, filteredResults);

    return true;
  },

  // --- RESULTS / GRADING ---
  getResults: (): Result[] => {
    initDb();
    return getStorageItem<Result[]>(KEYS.RESULTS, []);
  },
  getResultsByStudent: (studentId: string): Result[] => {
    return localDb.getResults().filter(r => r.studentId === studentId);
  },
  submitQuizAnswers: (studentId: string, chapterId: string, answers: { questionId: string; selectedAnswer: 'A' | 'B' | 'C' | 'D' }[]): { scorePercent: number; correctCount: number; totalCount: number } => {
    const results = localDb.getResults();
    const questions = localDb.getQuestionsByChapter(chapterId);
    let correctCount = 0;
    const submittedAt = new Date().toISOString();

    // Grade and insert rows
    answers.forEach(ans => {
      const q = questions.find(question => question.id === ans.questionId);
      if (!q) return;

      const isCorrect = q.correctAnswer === ans.selectedAnswer;
      if (isCorrect) correctCount++;

      const newResultRow: Result = {
        id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        studentId,
        questionId: ans.questionId,
        selectedAnswer: ans.selectedAnswer,
        isCorrect,
        submittedAt
      };
      results.push(newResultRow);
    });

    setStorageItem(KEYS.RESULTS, results);
    return {
      scorePercent: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
      correctCount,
      totalCount: questions.length
    };
  },

  // Helper for computing students scores per chapter
  getStudentScoresForTeacher: (teacherId: string) => {
    const students = localDb.getStudents().filter(s => s.teacherId === teacherId);
    const chapters = localDb.getChaptersByTeacher(teacherId);
    const results = localDb.getResults();
    const questions = localDb.getQuestions();

    return students.map(student => {
      const studentResults = results.filter(r => r.studentId === student.id);
      
      const chapterGrades = chapters.map(chapter => {
        const chapterQuestions = questions.filter(q => q.chapterId === chapter.id);
        const chapterQuestionIds = chapterQuestions.map(q => q.id);

        if (chapterQuestions.length === 0) return { chapterId: chapter.id, title: chapter.title, hasTaken: false, score: 0 };

        // Find results for these questions, getting the latest submission by date
        const relevantResults = studentResults.filter(r => chapterQuestionIds.includes(r.questionId));
        
        if (relevantResults.length === 0) return { chapterId: chapter.id, title: chapter.title, hasTaken: false, score: 0 };

        // Calculate grading
        const correctCount = relevantResults.filter(r => r.isCorrect).length;
        // If they answered fewer questions than total, count unanswered as wrong
        const score = Math.round((correctCount / chapterQuestions.length) * 100);

        return {
          chapterId: chapter.id,
          title: chapter.title,
          hasTaken: true,
          score
        };
      });

      const takenChapters = chapterGrades.filter(cg => cg.hasTaken);
      const avgScore = takenChapters.length > 0 
        ? Math.round(takenChapters.reduce((sum, cg) => sum + cg.score, 0) / takenChapters.length)
        : null;

      return {
        studentId: student.id,
        fullName: student.fullName,
        email: student.email,
        createdAt: student.createdAt,
        isSuspended: student.isSuspended,
        chapterGrades,
        avgScore
      };
    });
  },

  // Helper for Student Dashboard Performance History
  getStudentHistory: (studentId: string) => {
    const student = localDb.getStudent(studentId);
    if (!student || !student.teacherId) return [];

    const chapters = localDb.getChaptersByTeacher(student.teacherId);
    const results = localDb.getResultsByStudent(studentId);
    const questions = localDb.getQuestions();

    return chapters.map(chapter => {
      const chapterQuestions = questions.filter(q => q.chapterId === chapter.id);
      const chapterQuestionIds = chapterQuestions.map(q => q.id);

      if (chapterQuestions.length === 0) return { chapterId: chapter.id, title: chapter.title, hasTaken: false, score: 0, totalQuestions: 0 };

      const relevantResults = results.filter(r => chapterQuestionIds.includes(r.questionId));
      if (relevantResults.length === 0) return { chapterId: chapter.id, title: chapter.title, hasTaken: false, score: 0, totalQuestions: chapterQuestions.length };

      const correctCount = relevantResults.filter(r => r.isCorrect).length;
      const score = Math.round((correctCount / chapterQuestions.length) * 100);

      // Extract details
      const detailQuestions = chapterQuestions.map(q => {
        const studentAns = relevantResults.find(r => r.questionId === q.id);
        return {
          questionText: q.questionText,
          correctAnswer: q.correctAnswer,
          selectedAnswer: studentAns?.selectedAnswer,
          isCorrect: studentAns?.isCorrect ?? false
        };
      });

      return {
        chapterId: chapter.id,
        title: chapter.title,
        hasTaken: true,
        score,
        totalQuestions: chapterQuestions.length,
        correctCount,
        details: detailQuestions,
        submittedAt: relevantResults[0]?.submittedAt
      };
    });
  },

  // Helper for Admin Dashboard Metrics
  getAdminMetrics: () => {
    const teachers = localDb.getTeachers();
    const students = localDb.getStudents();
    const chapters = localDb.getChapters();
    const results = localDb.getResults();
    const questions = localDb.getQuestions();

    // Calculate overall statistics
    const totalQuizzesTaken = results.length > 0 
      ? new Set(results.map(r => `${r.studentId}-${questions.find(q => q.id === r.questionId)?.chapterId}`)).size 
      : 0;

    const totalQuestionsAnswered = results.length;
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const overallSuccessRate = totalQuestionsAnswered > 0 
      ? Math.round((correctAnswers / totalQuestionsAnswered) * 100) 
      : 0;

    return {
      totalTeachers: teachers.length,
      totalStudents: students.length,
      totalChapters: chapters.length,
      totalQuizzesTaken,
      overallSuccessRate,
      teachers: teachers.map(t => ({
        ...t,
        studentCount: students.filter(s => s.teacherId === t.id).length,
        chapterCount: chapters.filter(c => c.teacherId === t.id).length
      })),
      students: students.map(s => ({
        ...s,
        teacherName: teachers.find(t => t.id === s.teacherId)?.fullName ?? 'None'
      }))
    };
  }
};
