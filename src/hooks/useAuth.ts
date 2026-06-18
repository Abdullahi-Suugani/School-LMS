import { useState, useEffect } from 'react';
import { db } from '../db/db';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserSession {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  teacherId?: string; // For student
}

export const useAuth = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session from localStorage
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
    const sessionStr = localStorage.getItem('lms_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr) as UserSession;
        // Verify user is not suspended in real-time
        if (session.role === 'teacher') {
          const t = await db.getTeacher(session.id);
          if (t && !t.isSuspended) {
            if (isMounted) setUser(session);
          } else {
            localStorage.removeItem('lms_session');
          }
        } else if (session.role === 'student') {
          const s = await db.getStudent(session.id);
          if (s && !s.isSuspended) {
            if (isMounted) setUser({ ...session, teacherId: s.teacherId });
          } else {
            localStorage.removeItem('lms_session');
          }
        } else if (session.role === 'admin') {
          if (isMounted) setUser(session);
        }
      } catch {
        localStorage.removeItem('lms_session');
      }
    }
      if (isMounted) setLoading(false);
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    setError(null);
    if (!email || !password) {
      setError('Please fill in all fields.');
      return false;
    }

    if (role === 'admin') {
      if (email.toLowerCase() === 'admin@lms.com' && password === 'admin123') {
        const adminSession: UserSession = {
          id: 'admin-1',
          fullName: 'Administrator',
          email: 'admin@lms.com',
          role: 'admin'
        };
        setUser(adminSession);
        localStorage.setItem('lms_session', JSON.stringify(adminSession));
        return true;
      }
      setError('Invalid admin credentials.');
      return false;
    }

    if (role === 'teacher') {
      const teachers = await db.getTeachers();
      const teacher = teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
      if (!teacher || teacher.passwordHash !== password) {
        setError('Invalid email or password.');
        return false;
      }
      if (teacher.isSuspended) {
        setError('Your account has been suspended by the administrator.');
        return false;
      }
      const teacherSession: UserSession = {
        id: teacher.id,
        fullName: teacher.fullName,
        email: teacher.email,
        role: 'teacher'
      };
      setUser(teacherSession);
      localStorage.setItem('lms_session', JSON.stringify(teacherSession));
      return true;
    }

    if (role === 'student') {
      const students = await db.getStudents();
      const student = students.find(s => s.email.toLowerCase() === email.toLowerCase());
      if (!student || student.passwordHash !== password) {
        setError('Invalid email or password.');
        return false;
      }
      if (student.isSuspended) {
        setError('Your account has been suspended by the administrator.');
        return false;
      }
      const studentSession: UserSession = {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        role: 'student',
        teacherId: student.teacherId
      };
      setUser(studentSession);
      localStorage.setItem('lms_session', JSON.stringify(studentSession));
      return true;
    }

    return false;
  };

  const register = async (fullName: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    setError(null);
    if (!fullName || !email || !password) {
      setError('Please fill in all fields.');
      return false;
    }

    if (role === 'admin') {
      setError('Admin registration is not allowed.');
      return false;
    }

    // Check if email already exists
    const allTeachers = await db.getTeachers();
    const allStudents = await db.getStudents();
    const emailExists = 
      allTeachers.some(t => t.email.toLowerCase() === email.toLowerCase()) ||
      allStudents.some(s => s.email.toLowerCase() === email.toLowerCase()) ||
      email.toLowerCase() === 'admin@lms.com';

    if (emailExists) {
      setError('Email address is already registered.');
      return false;
    }

    if (role === 'teacher') {
      const newTeacher = await db.addTeacher({
        fullName,
        email: email.toLowerCase(),
        passwordHash: password
      });
      const session: UserSession = {
        id: newTeacher.id,
        fullName: newTeacher.fullName,
        email: newTeacher.email,
        role: 'teacher'
      };
      setUser(session);
      localStorage.setItem('lms_session', JSON.stringify(session));
      return true;
    }

    if (role === 'student') {
      const newStudent = await db.addStudent({
        fullName,
        email: email.toLowerCase(),
        passwordHash: password
      });
      const session: UserSession = {
        id: newStudent.id,
        fullName: newStudent.fullName,
        email: newStudent.email,
        role: 'student',
        teacherId: undefined
      };
      setUser(session);
      localStorage.setItem('lms_session', JSON.stringify(session));
      return true;
    }

    return false;
  };

  const resetPassword = async (email: string, newPass: string, role: UserRole): Promise<boolean> => {
    setError(null);
    if (!email || !newPass) {
      setError('Please fill in all fields.');
      return false;
    }

    if (role === 'admin') {
      setError('Admin password cannot be reset this way.');
      return false;
    }

    if (role === 'teacher') {
      const teachers = await db.getTeachers();
      const teacher = teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
      if (!teacher) {
        setError('No teacher found with this email.');
        return false;
      }
      await db.updateTeacher(teacher.id, { passwordHash: newPass });
      return true;
    }

    if (role === 'student') {
      const students = await db.getStudents();
      const student = students.find(s => s.email.toLowerCase() === email.toLowerCase());
      if (!student) {
        setError('No student found with this email.');
        return false;
      }
      await db.updateStudent(student.id, { passwordHash: newPass });
      return true;
    }

    return false;
  };

  const enroll = async (teacherId: string) => {
    if (user && user.role === 'student') {
      const success = await db.enrollStudent(user.id, teacherId);
      if (success) {
        const updatedSession = { ...user, teacherId };
        setUser(updatedSession);
        localStorage.setItem('lms_session', JSON.stringify(updatedSession));
      }
      return success;
    }
    return false;
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem('lms_session');
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    resetPassword,
    enroll,
    logout,
    setError
  };
};
