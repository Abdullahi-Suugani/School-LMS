import { supabase } from './supabaseClient';
import type { Chapter, Question, Result, Student, Teacher } from './localDb';

type DbError = { message: string };
type Answer = 'A' | 'B' | 'C' | 'D';

interface TeacherRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  is_suspended: boolean;
  created_at: string;
}

interface StudentRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  teacher_id: string | null;
  is_suspended: boolean;
  created_at: string;
}

interface ChapterRow {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  text_notes: string | null;
  video_link: string | null;
  pdf_name: string | null;
  created_at: string;
}

interface QuestionRow {
  id: string;
  chapter_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: Answer;
}

interface ResultRow {
  id: string;
  student_id: string;
  question_id: string;
  selected_answer: Answer;
  is_correct: boolean;
  submitted_at: string;
}

const requireClient = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.');
  }
  return supabase;
};

const throwIfError = (error: DbError | null) => {
  if (error) throw new Error(error.message);
};

const toTeacher = (row: TeacherRow): Teacher => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  passwordHash: row.password_hash,
  isSuspended: row.is_suspended,
  createdAt: row.created_at
});

const toTeacherRow = (teacher: Partial<Teacher>): Partial<TeacherRow> => ({
  full_name: teacher.fullName,
  email: teacher.email,
  password_hash: teacher.passwordHash,
  is_suspended: teacher.isSuspended
});

const toStudent = (row: StudentRow): Student => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  passwordHash: row.password_hash,
  teacherId: row.teacher_id ?? undefined,
  isSuspended: row.is_suspended,
  createdAt: row.created_at
});

const toStudentRow = (student: Partial<Student>): Partial<StudentRow> => ({
  full_name: student.fullName,
  email: student.email,
  password_hash: student.passwordHash,
  teacher_id: student.teacherId ?? null,
  is_suspended: student.isSuspended
});

const toChapter = (row: ChapterRow): Chapter => ({
  id: row.id,
  teacherId: row.teacher_id,
  title: row.title,
  description: row.description,
  textNotes: row.text_notes ?? undefined,
  videoLink: row.video_link ?? undefined,
  pdfName: row.pdf_name ?? undefined,
  createdAt: row.created_at
});

const toChapterRow = (chapter: Partial<Chapter>): Partial<ChapterRow> => ({
  teacher_id: chapter.teacherId,
  title: chapter.title,
  description: chapter.description,
  text_notes: chapter.textNotes,
  video_link: chapter.videoLink,
  pdf_name: chapter.pdfName
});

const toQuestion = (row: QuestionRow): Question => ({
  id: row.id,
  chapterId: row.chapter_id,
  questionText: row.question_text,
  optionA: row.option_a,
  optionB: row.option_b,
  optionC: row.option_c,
  optionD: row.option_d,
  correctAnswer: row.correct_answer
});

const toQuestionRow = (question: Partial<Question>): Partial<QuestionRow> => ({
  chapter_id: question.chapterId,
  question_text: question.questionText,
  option_a: question.optionA,
  option_b: question.optionB,
  option_c: question.optionC,
  option_d: question.optionD,
  correct_answer: question.correctAnswer
});

const toResult = (row: ResultRow): Result => ({
  id: row.id,
  studentId: row.student_id,
  questionId: row.question_id,
  selectedAnswer: row.selected_answer,
  isCorrect: row.is_correct,
  submittedAt: row.submitted_at
});

export const supabaseDb = {
  async getTeachers(): Promise<Teacher[]> {
    const { data, error } = await requireClient().from('teachers').select('*').order('created_at');
    throwIfError(error);
    return (data ?? []).map(toTeacher);
  },

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const { data, error } = await requireClient().from('teachers').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
    return data ? toTeacher(data) : undefined;
  },

  async addTeacher(teacher: Omit<Teacher, 'id' | 'isSuspended' | 'createdAt'>): Promise<Teacher> {
    const { data, error } = await requireClient()
      .from('teachers')
      .insert(toTeacherRow({ ...teacher, isSuspended: false }))
      .select('*')
      .single();
    throwIfError(error);
    return toTeacher(data);
  },

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher | undefined> {
    const { data, error } = await requireClient()
      .from('teachers')
      .update(toTeacherRow(updates))
      .eq('id', id)
      .select('*')
      .maybeSingle();
    throwIfError(error);
    return data ? toTeacher(data) : undefined;
  },

  async getStudents(): Promise<Student[]> {
    const { data, error } = await requireClient().from('students').select('*').order('created_at');
    throwIfError(error);
    return (data ?? []).map(toStudent);
  },

  async getStudent(id: string): Promise<Student | undefined> {
    const { data, error } = await requireClient().from('students').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
    return data ? toStudent(data) : undefined;
  },

  async addStudent(student: Omit<Student, 'id' | 'isSuspended' | 'createdAt'>): Promise<Student> {
    const { data, error } = await requireClient()
      .from('students')
      .insert(toStudentRow({ ...student, isSuspended: false }))
      .select('*')
      .single();
    throwIfError(error);
    return toStudent(data);
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const { data, error } = await requireClient()
      .from('students')
      .update(toStudentRow(updates))
      .eq('id', id)
      .select('*')
      .maybeSingle();
    throwIfError(error);
    return data ? toStudent(data) : undefined;
  },

  async enrollStudent(studentId: string, teacherId: string): Promise<boolean> {
    const student = await this.updateStudent(studentId, { teacherId: teacherId || undefined });
    return Boolean(student);
  },

  async getChapters(): Promise<Chapter[]> {
    const { data, error } = await requireClient().from('chapters').select('*').order('created_at');
    throwIfError(error);
    return (data ?? []).map(toChapter);
  },

  async getChaptersByTeacher(teacherId: string): Promise<Chapter[]> {
    const { data, error } = await requireClient()
      .from('chapters')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at');
    throwIfError(error);
    return (data ?? []).map(toChapter);
  },

  async getChapter(id: string): Promise<Chapter | undefined> {
    const { data, error } = await requireClient().from('chapters').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
    return data ? toChapter(data) : undefined;
  },

  async addChapter(chapter: Omit<Chapter, 'id' | 'createdAt'>): Promise<Chapter> {
    const { data, error } = await requireClient()
      .from('chapters')
      .insert(toChapterRow(chapter))
      .select('*')
      .single();
    throwIfError(error);
    return toChapter(data);
  },

  async updateChapter(id: string, updates: Partial<Omit<Chapter, 'id' | 'teacherId' | 'createdAt'>>): Promise<Chapter | undefined> {
    const { data, error } = await requireClient()
      .from('chapters')
      .update(toChapterRow(updates))
      .eq('id', id)
      .select('*')
      .maybeSingle();
    throwIfError(error);
    return data ? toChapter(data) : undefined;
  },

  async deleteChapter(id: string): Promise<boolean> {
    const { error } = await requireClient().from('chapters').delete().eq('id', id);
    throwIfError(error);
    return true;
  },

  async getQuestions(): Promise<Question[]> {
    const { data, error } = await requireClient().from('questions').select('*');
    throwIfError(error);
    return (data ?? []).map(toQuestion);
  },

  async getQuestionsByChapter(chapterId: string): Promise<Question[]> {
    const { data, error } = await requireClient().from('questions').select('*').eq('chapter_id', chapterId);
    throwIfError(error);
    return (data ?? []).map(toQuestion);
  },

  async getQuestion(id: string): Promise<Question | undefined> {
    const { data, error } = await requireClient().from('questions').select('*').eq('id', id).maybeSingle();
    throwIfError(error);
    return data ? toQuestion(data) : undefined;
  },

  async addQuestion(question: Omit<Question, 'id'>): Promise<Question> {
    const { data, error } = await requireClient()
      .from('questions')
      .insert(toQuestionRow(question))
      .select('*')
      .single();
    throwIfError(error);
    return toQuestion(data);
  },

  async updateQuestion(id: string, updates: Partial<Omit<Question, 'id' | 'chapterId'>>): Promise<Question | undefined> {
    const { data, error } = await requireClient()
      .from('questions')
      .update(toQuestionRow(updates))
      .eq('id', id)
      .select('*')
      .maybeSingle();
    throwIfError(error);
    return data ? toQuestion(data) : undefined;
  },

  async deleteQuestion(id: string): Promise<boolean> {
    const { error } = await requireClient().from('questions').delete().eq('id', id);
    throwIfError(error);
    return true;
  },

  async getResults(): Promise<Result[]> {
    const { data, error } = await requireClient().from('results').select('*');
    throwIfError(error);
    return (data ?? []).map(toResult);
  },

  async getResultsByStudent(studentId: string): Promise<Result[]> {
    const { data, error } = await requireClient().from('results').select('*').eq('student_id', studentId);
    throwIfError(error);
    return (data ?? []).map(toResult);
  },

  async submitQuizAnswers(
    studentId: string,
    chapterId: string,
    answers: { questionId: string; selectedAnswer: Answer }[]
  ): Promise<{ scorePercent: number; correctCount: number; totalCount: number }> {
    const questions = await this.getQuestionsByChapter(chapterId);
    let correctCount = 0;
    const submittedAt = new Date().toISOString();
    const rows = answers.flatMap((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) return [];
      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) correctCount += 1;
      return {
        student_id: studentId,
        question_id: answer.questionId,
        selected_answer: answer.selectedAnswer,
        is_correct: isCorrect,
        submitted_at: submittedAt
      };
    });

    if (rows.length > 0) {
      const { error } = await requireClient().from('results').insert(rows);
      throwIfError(error);
    }

    return {
      scorePercent: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
      correctCount,
      totalCount: questions.length
    };
  },

  async getStudentScoresForTeacher(teacherId: string) {
    const students = (await this.getStudents()).filter((student) => student.teacherId === teacherId);
    const chapters = await this.getChaptersByTeacher(teacherId);
    const results = await this.getResults();
    const questions = await this.getQuestions();

    return students.map((student) => {
      const studentResults = results.filter((result) => result.studentId === student.id);
      const chapterGrades = chapters.map((chapter) => {
        const chapterQuestions = questions.filter((question) => question.chapterId === chapter.id);
        const chapterQuestionIds = chapterQuestions.map((question) => question.id);

        if (chapterQuestions.length === 0) {
          return { chapterId: chapter.id, title: chapter.title, hasTaken: false, score: 0 };
        }

        const relevantResults = studentResults.filter((result) => chapterQuestionIds.includes(result.questionId));
        if (relevantResults.length === 0) {
          return { chapterId: chapter.id, title: chapter.title, hasTaken: false, score: 0 };
        }

        const correctCount = relevantResults.filter((result) => result.isCorrect).length;
        return {
          chapterId: chapter.id,
          title: chapter.title,
          hasTaken: true,
          score: Math.round((correctCount / chapterQuestions.length) * 100)
        };
      });

      const takenChapters = chapterGrades.filter((grade) => grade.hasTaken);
      const avgScore = takenChapters.length > 0
        ? Math.round(takenChapters.reduce((sum, grade) => sum + grade.score, 0) / takenChapters.length)
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

  async getStudentHistory(studentId: string) {
    const student = await this.getStudent(studentId);
    if (!student?.teacherId) return [];

    const chapters = await this.getChaptersByTeacher(student.teacherId);
    const results = await this.getResultsByStudent(studentId);
    const questions = await this.getQuestions();

    return chapters.map((chapter) => {
      const chapterQuestions = questions.filter((question) => question.chapterId === chapter.id);
      const chapterQuestionIds = chapterQuestions.map((question) => question.id);

      if (chapterQuestions.length === 0) {
        return { chapterId: chapter.id, title: chapter.title, hasTaken: false, score: 0, totalQuestions: 0 };
      }

      const relevantResults = results.filter((result) => chapterQuestionIds.includes(result.questionId));
      if (relevantResults.length === 0) {
        return { chapterId: chapter.id, title: chapter.title, hasTaken: false, score: 0, totalQuestions: chapterQuestions.length };
      }

      const correctCount = relevantResults.filter((result) => result.isCorrect).length;
      const details = chapterQuestions.map((question) => {
        const studentAnswer = relevantResults.find((result) => result.questionId === question.id);
        return {
          questionText: question.questionText,
          correctAnswer: question.correctAnswer,
          selectedAnswer: studentAnswer?.selectedAnswer,
          isCorrect: studentAnswer?.isCorrect ?? false
        };
      });

      return {
        chapterId: chapter.id,
        title: chapter.title,
        hasTaken: true,
        score: Math.round((correctCount / chapterQuestions.length) * 100),
        totalQuestions: chapterQuestions.length,
        correctCount,
        details,
        submittedAt: relevantResults[0]?.submittedAt
      };
    });
  },

  async getAdminMetrics() {
    const teachers = await this.getTeachers();
    const students = await this.getStudents();
    const chapters = await this.getChapters();
    const results = await this.getResults();
    const questions = await this.getQuestions();

    const totalQuizzesTaken = results.length > 0
      ? new Set(results.map((result) => `${result.studentId}-${questions.find((question) => question.id === result.questionId)?.chapterId}`)).size
      : 0;
    const correctAnswers = results.filter((result) => result.isCorrect).length;

    return {
      totalTeachers: teachers.length,
      totalStudents: students.length,
      totalChapters: chapters.length,
      totalQuizzesTaken,
      overallSuccessRate: results.length > 0 ? Math.round((correctAnswers / results.length) * 100) : 0,
      teachers: teachers.map((teacher) => ({
        ...teacher,
        studentCount: students.filter((student) => student.teacherId === teacher.id).length,
        chapterCount: chapters.filter((chapter) => chapter.teacherId === teacher.id).length
      })),
      students: students.map((student) => ({
        ...student,
        teacherName: teachers.find((teacher) => teacher.id === student.teacherId)?.fullName ?? 'None'
      }))
    };
  }
};
