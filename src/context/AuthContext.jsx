import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { ALLOWED_EMAIL_DOMAIN, MOCK_QUESTIONS } from '../lib/constants';

const AuthContext = createContext();

const MOCK_ROSTER = [
  {
    id: 'demo-student-id',
    full_name: 'Alex Student',
    email: `student${ALLOWED_EMAIL_DOMAIN}`,
    role: 'student',
    streak_count: 5,
    last_pass_date: new Date().toISOString().split('T')[0],
    solved_count: 3
  },
  {
    id: 'student-2',
    full_name: 'Rohan Verma',
    email: `rohan${ALLOWED_EMAIL_DOMAIN}`,
    role: 'student',
    streak_count: 2,
    last_pass_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    solved_count: 2
  },
  {
    id: 'student-3',
    full_name: 'Priya Sharma',
    email: `priya${ALLOWED_EMAIL_DOMAIN}`,
    role: 'student',
    streak_count: 0,
    last_pass_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    solved_count: 1
  },
  {
    id: 'student-4',
    full_name: 'Siddharth Patel (Skipped 4 Days)',
    email: `siddharth${ALLOWED_EMAIL_DOMAIN}`,
    role: 'student',
    streak_count: 0,
    last_pass_date: new Date(Date.now() - 345600000).toISOString().split('T')[0],
    solved_count: 0
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionsList, setQuestionsList] = useState(MOCK_QUESTIONS);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [studentRoster, setStudentRoster] = useState(MOCK_ROSTER);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
  };

  const hideToast = () => {
    setToastMessage(null);
  };

  // Helper to calculate exact consecutive daily streak
  const calculateStreak = (submissions) => {
    if (!submissions || submissions.length === 0) return 0;
    
    const passedDates = Array.from(
      new Set(
        submissions
          .filter(s => s.verdict === 'pass')
          .map(s => s.submitted_at ? s.submitted_at.split('T')[0] : null)
          .filter(Boolean)
      )
    ).sort((a, b) => new Date(b) - new Date(a));

    if (passedDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const mostRecent = passedDates[0];
    if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date(mostRecent);

    for (let i = 0; i < passedDates.length; i++) {
      const dateString = checkDate.toISOString().split('T')[0];
      if (passedDates.includes(dateString)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Fetch student roster for admin view
  const fetchStudentRoster = async () => {
    if (!isFirebaseConfigured || !db) {
      setStudentRoster(MOCK_ROSTER);
      return;
    }

    try {
      const rosterQuery = query(collection(db, 'profiles'), where('role', '==', 'student'));
      const rosterSnap = await getDocs(rosterQuery);

      const subSnap = await getDocs(collection(db, 'submissions'));
      const submissionsData = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const roster = rosterSnap.docs.map(docSnap => {
        const p = { id: docSnap.id, ...docSnap.data() };
        const studentSubs = submissionsData.filter(s => s.student_id === p.id && s.verdict === 'pass');
        const solvedCount = new Set(studentSubs.map(s => s.question_id)).size;
        const lastPass = studentSubs.length > 0 
          ? studentSubs.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0].submitted_at.split('T')[0]
          : p.last_pass_date;

        return {
          ...p,
          solved_count: solvedCount,
          last_pass_date: lastPass
        };
      });

      setStudentRoster(roster);
    } catch (err) {
      console.error('Failed to fetch student roster from Firestore:', err);
    }
  };

  // Remove / Drop inactive student
  const removeStudent = async (studentId) => {
    setStudentRoster(prev => prev.filter(s => s.id !== studentId));

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'profiles', studentId));
        showToast('Student removed from batch successfully.', 'info');
      } catch (err) {
        console.error('Error removing student:', err);
        showToast(`Removal error: ${err.message}`, 'error');
      }
    } else {
      showToast('Student removed from batch (Demo Mode).', 'info');
    }
  };

  // Fetch user profile & submissions from Firestore
  const fetchUserProfile = async (userId) => {
    if (!isFirebaseConfigured || !db || !userId) return;

    try {
      const profRef = doc(db, 'profiles', userId);
      const profSnap = await getDoc(profRef);
      const profData = profSnap.exists() ? { id: profSnap.id, ...profSnap.data() } : null;

      const subQuery = query(collection(db, 'submissions'), where('student_id', '==', userId));
      const subSnap = await getDocs(subQuery);
      const submissions = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setUserSubmissions(submissions);
      const computedStreak = calculateStreak(submissions);

      if (profData) {
        setProfile({
          ...profData,
          streak_count: computedStreak
        });

        if (profData.streak_count !== computedStreak) {
          await updateDoc(profRef, { streak_count: computedStreak });
        }
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
    }
  };

  const loginDemoUser = (role = 'student') => {
    const isStudent = role === 'student';
    const demoUser = {
      uid: isStudent ? 'demo-student-id' : 'demo-admin-id',
      email: isStudent ? `student${ALLOWED_EMAIL_DOMAIN}` : `admin${ALLOWED_EMAIL_DOMAIN}`
    };
    const demoProfile = {
      id: demoUser.uid,
      email: demoUser.email,
      full_name: isStudent ? 'Alex Student (Demo)' : 'Senior Instructor (Admin Demo)',
      role: isStudent ? 'student' : 'admin',
      streak_count: isStudent ? 5 : 12,
      last_pass_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    setUser(demoUser);
    setProfile(demoProfile);
    showToast(`Logged in as ${demoProfile.full_name} (${demoProfile.role.toUpperCase()})`, 'success');
  };

  // Firebase Auth State Listener
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      loginDemoUser('student');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser.uid);
      } else {
        loginDemoUser('student');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch questions from Firestore with real-time listener
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const q = query(collection(db, 'questions'), orderBy('posted_date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const loadedQuestions = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setQuestionsList(loadedQuestions);
      }
    }, (err) => {
      console.error('Error listening to questions:', err);
    });

    return () => unsubscribe();
  }, []);

  // Firebase Sign Up with email domain check
  const signup = async ({ email, password, fullName }) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail.endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase())) {
      throw new Error(`Registration restricted: Email must end with ${ALLOWED_EMAIL_DOMAIN}`);
    }

    if (!isFirebaseConfigured || !auth) {
      const newUser = { uid: `user-${Date.now()}`, email: trimmedEmail };
      const newProf = {
        id: newUser.uid,
        email: trimmedEmail,
        full_name: fullName || trimmedEmail.split('@')[0],
        role: 'student',
        streak_count: 0,
        last_pass_date: null,
        created_at: new Date().toISOString()
      };
      setUser(newUser);
      setProfile(newProf);
      showToast('Account created successfully (Demo Mode).', 'success');
      return { user: newUser, profile: newProf };
    }

    const userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    const newUserId = userCred.user.uid;
    const initialRole = trimmedEmail.startsWith('admin@') ? 'admin' : 'student';

    const newProfileData = {
      id: newUserId,
      email: trimmedEmail,
      full_name: fullName || trimmedEmail.split('@')[0],
      role: initialRole,
      streak_count: 0,
      last_pass_date: null,
      created_at: serverTimestamp()
    };

    await setDoc(doc(db, 'profiles', newUserId), newProfileData);
    setUser(userCred.user);
    setProfile(newProfileData);
    showToast('Account created successfully!', 'success');
    return userCred;
  };

  // Firebase Sign In
  const login = async ({ email, password }) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!isFirebaseConfigured || !auth) {
      const isAdmin = trimmedEmail.includes('admin');
      loginDemoUser(isAdmin ? 'admin' : 'student');
      return;
    }

    const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    await fetchUserProfile(userCred.user.uid);
    showToast('Signed in successfully.', 'success');
    return userCred;
  };

  // Firebase Sign Out
  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setUser(null);
    setProfile(null);
    setUserSubmissions([]);
    showToast('Signed out.', 'info');
  };

  // Record submission in Firestore & update streak
  const recordSubmission = async (questionId, verdict, code, language, testResults) => {
    if (!user || !profile) {
      showToast('You must be logged in to submit.', 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const newSubObj = {
      id: `sub-${Date.now()}`,
      student_id: profile.id || user.uid,
      question_id: questionId,
      code,
      language,
      verdict,
      test_results: testResults,
      submitted_at: new Date().toISOString()
    };

    const updatedSubmissions = [newSubObj, ...userSubmissions];
    setUserSubmissions(updatedSubmissions);

    const newComputedStreak = calculateStreak(updatedSubmissions);

    if (verdict === 'pass') {
      setProfile(prev => prev ? { 
        ...prev, 
        streak_count: newComputedStreak,
        last_pass_date: todayStr
      } : prev);
    }

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'submissions'), {
          student_id: profile.id || user.uid,
          question_id: questionId,
          code,
          language,
          verdict,
          test_results: testResults,
          submitted_at: new Date().toISOString()
        });

        if (verdict === 'pass') {
          await updateDoc(doc(db, 'profiles', profile.id || user.uid), {
            streak_count: newComputedStreak,
            last_pass_date: todayStr
          });
        }
      } catch (err) {
        console.error('Error saving submission to Firestore:', err);
      }
    }
  };

  // Admin Question Handlers (Firestore)
  const addQuestion = async (qData) => {
    const postedDate = qData.posted_date || new Date().toISOString().split('T')[0];

    if (!isFirebaseConfigured || !db) {
      const newQ = { id: `q-${Date.now()}`, ...qData, posted_date: postedDate };
      setQuestionsList(prev => [newQ, ...prev]);
      showToast('Question posted (Demo Mode).', 'success');
      return newQ;
    }

    try {
      const docRef = await addDoc(collection(db, 'questions'), {
        title: qData.title,
        description: qData.description,
        difficulty: qData.difficulty,
        test_cases: qData.test_cases,
        posted_date: postedDate,
        posted_by: profile?.id || user?.uid,
        created_at: serverTimestamp()
      });

      const newQuestion = { id: docRef.id, ...qData, posted_date: postedDate };
      showToast('Question published to batch!', 'success');
      return newQuestion;
    } catch (err) {
      console.error('Error posting question to Firestore:', err);
      showToast(`Failed to post question: ${err.message}`, 'error');
      throw err;
    }
  };

  const updateQuestion = async (id, updatedFields) => {
    setQuestionsList(prev => prev.map(q => q.id === id ? { ...q, ...updatedFields } : q));

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'questions', id), updatedFields);
        showToast('Question updated successfully!', 'success');
      } catch (err) {
        console.error('Error updating question in Firestore:', err);
        showToast(`Update error: ${err.message}`, 'error');
      }
    } else {
      showToast('Question updated (Demo Mode).', 'success');
    }
  };

  const deleteQuestion = async (id) => {
    setQuestionsList(prev => prev.filter(q => q.id !== id));

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'questions', id));
        showToast('Question deleted successfully.', 'info');
      } catch (err) {
        console.error('Error deleting question from Firestore:', err);
        showToast(`Delete error: ${err.message}`, 'error');
      }
    } else {
      showToast('Question deleted (Demo Mode).', 'info');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      loginDemoUser,
      signup,
      login,
      logout,
      questionsList,
      userSubmissions,
      studentRoster,
      fetchStudentRoster,
      removeStudent,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      recordSubmission,
      toastMessage,
      showToast,
      hideToast
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
