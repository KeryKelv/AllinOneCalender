import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Circle, CheckCircle2, LogOut, Loader2, Target, Home, AlertCircle, LayoutDashboard, CheckSquare, BookOpen, Download, X, Calendar as CalendarIcon, GraduationCap, PartyPopper, ChevronLeft, ChevronRight, Quote, MapPin, Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyCpWm7T2pez61uWRpObqjwAmzjbbvzxwLA",
  authDomain: "todo-mini-bk.firebaseapp.com",
  projectId: "todo-mini-bk",
  storageBucket: "todo-mini-bk.firebasestorage.app",
  messagingSenderId: "140758949371",
  appId: "1:140758949371:web:c9652e1d3ce840c5da3f5e",
  measurementId: "G-EP2WE8Q287"
};

const isConfigValid = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey.trim() !== "";

let app, auth, db, googleProvider;
if (isConfigValid) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
}

function SimpleCalendar({ currentMonth, selectedDate, onDateSelect, onMonthChange }) {
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; 
  const days = [];
  
  for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth(currentMonth); i++) days.push(i);
  
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  
  const calendarStyle = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' };
  
  return (
    <div style={{ backgroundColor: '#1e1a3b', padding: '20px', borderRadius: '16px', border: '1px solid #31285c', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontWeight: 700, color: '#f8fafc', margin: 0, fontSize: '18px' }}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#a78bfa' }}><ChevronLeft size={24} /></button>
          <button onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} style={{ padding: '4px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#a78bfa' }}><ChevronRight size={24} /></button>
        </div>
      </div>
      <div style={{ ...calendarStyle, marginBottom: '12px' }}>
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: '14px', fontWeight: 800, color: '#8b5cf6' }}>{day}</div>
        ))}
      </div>
      <div style={calendarStyle}>
        {days.map((day, idx) => (
          <button 
            key={idx} 
            onClick={() => day && onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
            style={{
              padding: '10px 0', borderRadius: '8px', fontSize: '15px', fontWeight: 700, border: 'none',
              cursor: day ? 'pointer' : 'default',
              backgroundColor: day === selectedDate?.getDate() && currentMonth.getMonth() === selectedDate?.getMonth() ? '#8b5cf6' : day ? '#2a244d' : '#14112a',
              color: day === selectedDate?.getDate() && currentMonth.getMonth() === selectedDate?.getMonth() ? '#ffffff' : day ? '#cbd5e1' : '#31285c',
              transition: 'all 0.2s'
            }}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}

const QUOTES = [
  "Kỷ luật là cầu nối giữa mục tiêu và thành tựu. – Jim Rohn",
  "Cách tốt nhất để dự đoán tương lai là tạo ra nó. – Peter Drucker",
  "Không có áp lực, không có kim cương. – Thomas Carlyle",
  "Động lực giúp bạn bắt đầu. Thói quen giúp bạn tiếp tục. – Jim Ryun",
  "Người khôn ngoan là người học được những sự thật này: Nghe, nhìn, và im lặng.",
  "Đừng hạ thấp mục tiêu của bạn, hãy tăng cường sự nỗ lực.",
  "Mọi công trình vĩ đại đều bắt đầu từ một bản vẽ chi tiết.",
  "Thành công không phải là đích đến, mà là hành trình bạn đang đi."
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [trackItems, setTrackItems] = useState([]);
  const [timetableData, setTimetableData] = useState({ classes: [], semesterStart: '' });
  const [exams, setExams] = useState([]);
  const [events, setEvents] = useState([]); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [calendarTab, setCalendarTab] = useState('study');

  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('work');
  const [newDeadline, setNewDeadline] = useState('');
  const [newTrack, setNewTrack] = useState('');
  const [newTrackMode, setNewTrackMode] = useState('daily');
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [showMyBKModal, setShowMyBKModal] = useState(false);
  const [rawTKB, setRawTKB] = useState('');
  const [semesterStart, setSemesterStart] = useState('');
  const [autoDetected, setAutoDetected] = useState(false);

  const [showManualClassModal, setShowManualClassModal] = useState(false);
  const [manualClass, setManualClass] = useState({ name: '', day: '2', startPeriod: '1', span: '2', room: '' });
  
  const [showExamSyncModal, setShowExamSyncModal] = useState(false);
  const [rawExamText, setRawExamText] = useState('');
  const [showManualExamModal, setShowManualExamModal] = useState(false);
  const [manualExam, setManualExam] = useState({ subject: '', date: '', startTime: '', room: '', type: 'CK' });

  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventObj, setNewEventObj] = useState({ title: '', date: '', time: '', location: '', type: 'Hội thảo' });

  const [quoteOfDay, setQuoteOfDay] = useState('');

  // Pomodoro States
  const [pomoSetting, setPomoSetting] = useState(25);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState('work'); 

  useEffect(() => {
    setQuoteOfDay(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  useEffect(() => {
    if (!isPomodoroActive && pomodoroMode === 'work') {
      setPomodoroTime(pomoSetting * 60);
    }
  }, [pomoSetting, isPomodoroActive, pomodoroMode]);

  useEffect(() => {
    let interval = null;
    const workTime = pomoSetting * 60;
    const breakTime = pomoSetting === 25 ? 5 * 60 : 15 * 60;

    if (isPomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((time) => time - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setIsPomodoroActive(false);
      if (pomodoroMode === 'work') {
        alert(`Hết giờ làm việc! Bạn đã làm rất tốt. Hãy nghỉ giải lao ${pomoSetting === 25 ? 5 : 15} phút nhé.`);
        setPomodoroMode('break');
        setPomodoroTime(breakTime);
      } else {
        alert("Hết giờ nghỉ giải lao! Cùng quay lại tập trung nào.");
        setPomodoroMode('work');
        setPomodoroTime(workTime);
      }
    }
    return () => clearInterval(interval);
  }, [isPomodoroActive, pomodoroTime, pomodoroMode, pomoSetting]);

  const formatPomodoroTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (!isConfigValid) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isConfigValid) return;
    
    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      taskList.sort((a, b) => a.createdAt - b.createdAt);
      setTasks(taskList);
    });

    const trackingRef = collection(db, 'users', user.uid, 'tracking');
    const unsubTracking = onSnapshot(trackingRef, (snapshot) => {
      const trackingList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      trackingList.sort((a, b) => a.createdAt - b.createdAt);
      setTrackItems(trackingList);
    });

    const fetchSettings = async () => {
      const tkbRef = doc(db, 'users', user.uid, 'settings', 'timetable');
      const tkbSnap = await getDoc(tkbRef);
      if (tkbSnap.exists()) setTimetableData(tkbSnap.data());

      const examRef = doc(db, 'users', user.uid, 'settings', 'exams');
      const examSnap = await getDoc(examRef);
      if (examSnap.exists()) setExams(examSnap.data().list || []);

      const eventRef = doc(db, 'users', user.uid, 'settings', 'events');
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) setEvents(eventSnap.data().list || []);
    };
    fetchSettings();

    return () => {
      unsubTasks();
      unsubTracking();
    };
  }, [user]);

  const handleLogin = async () => {
    if (!isConfigValid) return;
    try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    if (!isConfigValid) return;
    await signOut(auth);
    setTasks([]);
    setTrackItems([]);
    setTimetableData({ classes: [], semesterStart: '' });
    setExams([]);
    setEvents([]);
  };

  const parseMyBKSchedule = (rawText) => {
    const classes = [];
    const lines = rawText.split('\n');
    for (let line of lines) {
      const cols = line.split('\t');
      if (cols.length >= 10 && /^\d{5}$/.test(cols[0].trim())) {
        classes.push({
          id: cols[1].trim(), name: cols[2].trim(), credits: cols[3].trim(), group: cols[5].trim(),
          day: cols[6].trim(), period: cols[7].trim(), time: cols[8].trim(), room: cols[9].trim(),
          campus: cols[10]?.trim() || '', weeks: cols[11]?.trim() || ''
        });
      }
    }
    return classes;
  };

  const handleRawTKBChange = (e) => {
    const text = e.target.value;
    setRawTKB(text);
    const weekMatch = text.match(/Tuần:\s*(\d+)\s*,\s*.*?[Nn]gày\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
    if (weekMatch) {
      const currentWeekNum = parseInt(weekMatch[1], 10);
      const pasteDate = new Date(parseInt(weekMatch[4], 10), parseInt(weekMatch[3], 10) - 1, parseInt(weekMatch[2], 10));
      const diffToMonday = pasteDate.getDay() === 0 ? 6 : pasteDate.getDay() - 1; 
      const startD = new Date(pasteDate);
      startD.setDate(pasteDate.getDate() - diffToMonday - (currentWeekNum - 1) * 7); 
      setSemesterStart(`${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`);
      setAutoDetected(true);
    } else {
      setAutoDetected(false);
    }
  };

  const handleSaveTKB = async () => {
    if (!user || !rawTKB.trim()) return;
    const parsedClasses = parseMyBKSchedule(rawTKB);
    if (parsedClasses.length === 0) { alert('Không tìm thấy dữ liệu hợp lệ.'); return; }
    if (!semesterStart) { alert('Vui lòng chọn Ngày bắt đầu Tuần 1.'); return; }
    
    const payload = { classes: parsedClasses, semesterStart: semesterStart };
    await setDoc(doc(db, 'users', user.uid, 'settings', 'timetable'), payload);
    setTimetableData(payload); setShowMyBKModal(false); setRawTKB(''); setAutoDetected(false);
  };

  const handleAddManualClass = async (e) => {
    e.preventDefault();
    if (!manualClass.name.trim()) return;
    const start = parseInt(manualClass.startPeriod, 10);
    const span = parseInt(manualClass.span, 10);
    const newClass = {
        id: `M${Date.now().toString().slice(-4)}`,
        name: manualClass.name.trim(),
        credits: '', group: '',
        day: manualClass.day,
        period: `${start} - ${start + span - 1}`,
        time: '', room: manualClass.room, campus: '',
        weeks: '', 
        isManual: true
    };
    const payload = { ...timetableData, classes: [...(timetableData.classes || []), newClass] };
    await setDoc(doc(db, 'users', user.uid, 'settings', 'timetable'), payload);
    setTimetableData(payload); setShowManualClassModal(false); setManualClass({ name: '', day: '2', startPeriod: '1', span: '2', room: '' });
  };

  const handleDeleteClass = async (id) => {
    const newList = timetableData.classes.filter(c => c.id !== id);
    const payload = { ...timetableData, classes: newList };
    await setDoc(doc(db, 'users', user.uid, 'settings', 'timetable'), payload);
    setTimetableData(payload);
  };

  const saveExamsToDB = async (newList) => {
    await setDoc(doc(db, 'users', user.uid, 'settings', 'exams'), { list: newList });
    setExams(newList);
  };

  const parseExamSchedule = (rawText) => {
    const examsList = [];
    const lines = rawText.split('\n');
    for (let line of lines) {
      const cols = line.split('\t');
      if (cols.length >= 10 && /^\d{5}$/.test(cols[0].trim())) {
        examsList.push({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          subject: cols[1].trim(), date: cols[3].trim(), type: cols[4].trim(),
          room: cols[6].trim(), startTime: cols[8].trim().replace('g', ':'), duration: cols[9].trim(),
          isManual: false
        });
      }
    }
    return examsList;
  };

  const handleSaveExamSync = async () => {
    if (!user || !rawExamText.trim()) return;
    const parsed = parseExamSchedule(rawExamText);
    if (parsed.length === 0) { alert('Không tìm thấy dữ liệu thi hợp lệ.'); return; }
    const manualExams = exams.filter(e => e.isManual);
    const newList = [...manualExams, ...parsed];
    await saveExamsToDB(newList); setShowExamSyncModal(false); setRawExamText('');
  };

  const handleAddManualExam = async (e) => {
    e.preventDefault();
    if (!manualExam.subject.trim() || !manualExam.date) return;
    const newExam = { id: Date.now().toString(), subject: manualExam.subject.trim(), date: manualExam.date, startTime: manualExam.startTime, room: manualExam.room, type: manualExam.type, isManual: true };
    await saveExamsToDB([...exams, newExam]);
    setShowManualExamModal(false); setManualExam({ subject: '', date: '', startTime: '', room: '', type: 'CK' });
  };

  const handleDeleteExam = async (id) => {
    const newList = exams.filter(e => e.id !== id);
    await saveExamsToDB(newList);
  };

  const saveEventsToDB = async (newList) => {
    await setDoc(doc(db, 'users', user.uid, 'settings', 'events'), { list: newList });
    setEvents(newList);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEventObj.title.trim() || !newEventObj.date) return;
    const eventItem = { id: Date.now().toString(), title: newEventObj.title.trim(), date: newEventObj.date, time: newEventObj.time, location: newEventObj.location, type: newEventObj.type };
    await saveEventsToDB([...events, eventItem]);
    setShowEventModal(false); setNewEventObj({ title: '', date: '', time: '', location: '', type: 'Hội thảo' });
  };

  const handleDeleteEvent = async (id) => {
    const newList = events.filter(e => e.id !== id);
    await saveEventsToDB(newList);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !newDeadline || !user || !isConfigValid) return;
    const taskId = Date.now().toString();
    await setDoc(doc(db, 'users', user.uid, 'tasks', taskId), { text: newTask.trim(), completed: false, category: newCategory, dueDate: selectedDate.toISOString().split('T')[0], deadline: newDeadline, createdAt: Date.now() });
    setNewTask(''); setNewDeadline('');
  };
  const handleToggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !user || !isConfigValid) return;
    await setDoc(doc(db, 'users', user.uid, 'tasks', id), { ...task, completed: !task.completed });
  };
  const handleDeleteTask = async (id) => {
    if (!user || !isConfigValid) return;
    await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
  };
  const handleAddTrack = async (e) => {
    e.preventDefault();
    if (!newTrack.trim() || !user || !isConfigValid) return;
    const trackId = Date.now().toString();
    await setDoc(doc(db, 'users', user.uid, 'tracking', trackId), { text: newTrack.trim(), mode: newTrackMode, done: false, createdAt: Date.now() });
    setNewTrack('');
  };
  const handleToggleTrack = async (id) => {
    const item = trackItems.find(t => t.id === id);
    if (!item || !user || !isConfigValid) return;
    await setDoc(doc(db, 'users', user.uid, 'tracking', id), { ...item, done: !item.done });
  };
  
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [year, month, day] = deadline.split('-');
    const deadlineDate = new Date(year, month - 1, day); deadlineDate.setHours(0, 0, 0, 0);
    return Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  };
  const getDeadlineColor = (daysLeft) => {
    if (daysLeft === null) return '#4c3e8c';
    if (daysLeft < 0) return '#ef4444'; 
    if (daysLeft === 0) return '#f97316'; 
    if (daysLeft <= 3) return '#eab308'; 
    if (daysLeft <= 7) return '#84cc16'; 
    return '#22c55e'; 
  };
  
  const formatDateVN = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    const dayStr = dayOfWeek === 0 ? 'Chủ Nhật' : `Thứ ${dayOfWeek + 1}`;
    return `${dayStr} (${day}/${month}/${year})`;
  };

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
    setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
    setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  };

  const getWeekDates = (baseDate) => {
    const date = new Date(baseDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const week = [];
    for(let i=0; i<7; i++) {
       week.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    }
    return week;
  };

  const parsePeriodToGrid = (periodStr) => {
    if (!periodStr) return { start: 1, span: 1 };
    const parts = periodStr.split('-').map(s => parseInt(s.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { start: parts[0], span: parts[1] - parts[0] + 1 };
    }
    if (parts.length === 1 && !isNaN(parts[0])) return { start: parts[0], span: 1 };
    return { start: 1, span: 1 };
  };

  const getDayColumnIndex = (dayStr) => {
    const mapping = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'CN': 8 };
    return mapping[dayStr] || 2;
  };

  const getTodayString = () => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const dayStr = dayOfWeek === 0 ? 'Chủ Nhật' : `Thứ ${dayOfWeek + 1}`;
    const date = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${dayStr}, ${date}/${month}/${year}`;
  };

  const getEventBadgeStyle = (type) => {
    switch (type) {
      case 'Hội thảo': return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8' };
      case 'CLB/Đội nhóm': return { bg: 'rgba(244, 63, 94, 0.15)', text: '#f43f5e' };
      case 'Cá nhân': return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80' };
      default: return { bg: 'rgba(167, 139, 250, 0.15)', text: '#d8b4fe' };
    }
  };

  if (!isConfigValid || loading) {
    return <div style={{ height: '100vh', width: '100vw', backgroundColor: '#0d0b1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {loading ? <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#8b5cf6' }} size={40} /> : <p style={{color: '#f8fafc', fontSize: '16px'}}>Lỗi Firebase Config</p>}
    </div>;
  }

  if (!user) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: 'linear-gradient(to bottom right, #2e1065 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflow: 'hidden', position: 'relative', fontFamily: 'system-ui' }}>
        <div style={{ backgroundColor: 'rgba(30, 26, 59, 0.4)', backdropFilter: 'blur(12px)', padding: '48px', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.2)', textAlign: 'center', boxShadow: '0 20px 25px rgba(0,0,0,0.5)', maxWidth: '512px', zIndex: 10 }}>
          <Target size={48} color="#8b5cf6" style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#f8fafc', marginBottom: '12px' }}>Kế hoạch BK</h1>
          <p style={{ color: '#c4b5fd', fontSize: '16px', marginBottom: '40px' }}>Quản lý công việc hiệu quả</p>
          <button onClick={handleLogin} style={{ width: '100%', background: 'linear-gradient(to right, #7c3aed, #a855f7)', color: '#fff', padding: '16px 24px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '16px' }}>Đăng nhập với Google</button>
        </div>
      </div>
    );
  }

  const categoryEmojis = { work: '💼', personal: '🎯' };
  const categories = ['work', 'personal'];
  const tasksByCategory = categories.map(cat => ({ name: cat, emoji: categoryEmojis[cat], count: tasks.filter(t => t.category === cat).length }));
  
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const pendingTasksCount = tasks.length - completedTasksCount;
  const urgentTasks = tasks.filter(t => !t.completed && getDaysRemaining(t.deadline) !== null && getDaysRemaining(t.deadline) <= 3).sort((a, b) => getDaysRemaining(a.deadline) - getDaysRemaining(b.deadline));
  const completedTrackingCount = trackItems.filter(t => t.done).length;

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  let currentWeekNum = null;
  let currentWeekStr = null;
  if (timetableData.semesterStart) {
    const startD = new Date(timetableData.semesterStart);
    startD.setHours(0, 0, 0, 0);
    const targetD = new Date(selectedDate);
    targetD.setHours(0, 0, 0, 0);
    const diffTime = targetD.getTime() - startD.getTime();
    if (diffTime >= 0) {
      currentWeekNum = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;
      currentWeekStr = String(currentWeekNum).padStart(2, '0');
    }
  }

  const dayOfWeekInt = selectedDate.getDay();
  const mapDayToString = dayOfWeekInt === 0 ? 'CN' : (dayOfWeekInt + 1).toString();
  
  const agendaClasses = timetableData.classes?.filter(c => {
    if (c.day !== mapDayToString) return false;
    if (!timetableData.semesterStart && !c.isManual) return true; 
    if (currentWeekStr === null && !c.isManual) return false; 
    return c.weeks ? c.weeks.includes(currentWeekStr) : true;
  }) || [];
  const agendaExams = exams.filter(e => e.date === selectedDateStr);
  const agendaEvents = events.filter(e => e.date === selectedDateStr);
  const agendaTasks = tasks.filter(t => !t.completed && t.deadline === selectedDateStr);

  const hasAnyAgenda = agendaClasses.length > 0 || agendaExams.length > 0 || agendaEvents.length > 0 || agendaTasks.length > 0;

  const activeClassesThisWeek = timetableData.classes?.filter(c => {
    if (!timetableData.semesterStart && !c.isManual) return true;
    if (currentWeekStr === null && !c.isManual) return false;
    return c.weeks ? c.weeks.includes(currentWeekStr) : true;
  }) || [];

  const weekDates = getWeekDates(selectedDate);
  const daysOfWeekLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  const sortedExams = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'linear-gradient(to bottom right, #0d0b1a 0%, #1b1635 100%)', display: 'flex', justifyContent: 'center', paddingLeft: '0', fontFamily: 'system-ui', overflow: 'hidden' }}>
      
      {/* ===== SIDEBAR ===== */}
      <div style={{ width: '260px', background: 'linear-gradient(to bottom, #090714, #120f26)', color: '#f8fafc', display: 'flex', flexDirection: 'column', borderRight: '1px solid #2d2454', zIndex: 20 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #2d2454' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><span>📋</span> Kế hoạch</h1>
          <p style={{ fontSize: '13px', color: '#a78bfa', marginTop: '6px' }}>{user?.displayName || user?.email}</p>
        </div>
        
        <nav style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'my-tasks', label: 'My tasks', icon: CheckSquare },
            { id: 'calendar', label: 'Lịch', icon: CalendarIcon }
          ].map(item => (
            <button 
              key={item.id} onClick={() => setCurrentView(item.id)} 
              style={{ width: 'calc(100% - 32px)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 700, fontSize: '15px', backgroundColor: currentView === item.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent', color: currentView === item.id ? '#f8fafc' : '#94a3b8', borderLeft: currentView === item.id ? '4px solid #8b5cf6' : '4px solid transparent' }}>
              <item.icon size={20} color={currentView === item.id ? "#8b5cf6" : "#64748b"} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div style={{ padding: '16px', borderTop: '1px solid #2d2454' }}>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', transition: 'all 0.2s', fontWeight: 700, fontSize: '15px' }}>
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* TOP BAR */}
        <div style={{ backgroundColor: '#16122e', borderBottom: '1px solid #2d2454', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 900, background: 'linear-gradient(to right, #a78bfa, #d8b4fe)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            {currentView === 'dashboard' && 'Dashboard Tổng Quan'}
            {currentView === 'my-tasks' && 'Quản Lý Công Việc'}
            {currentView === 'calendar' && 'Hệ Thống Lịch'}
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#1e1a3b', padding: '10px 20px', borderRadius: '12px', border: '1px solid #31285c', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            <CalendarIcon size={20} color="#8b5cf6" />
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '15px' }}>{getTodayString()}</span>
          </div>
        </div>

        {/* --- VIEW: DASHBOARD --- */}
        {currentView === 'dashboard' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              <div style={{ backgroundColor: '#1e1a3b', padding: '20px', borderRadius: '16px', border: '1px solid #31285c', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                  <Target size={32} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>Tiến độ công việc</p>
                  <p style={{ margin: 0, fontSize: '28px', color: '#f8fafc', fontWeight: 900 }}>{completedTasksCount} <span style={{fontSize: '18px', color: '#64748b'}}>/ {tasks.length}</span></p>
                </div>
              </div>
              
              <div style={{ backgroundColor: '#1e1a3b', padding: '20px', borderRadius: '16px', border: '1px solid #31285c', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <AlertCircle size={32} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>Việc chờ xử lý</p>
                  <p style={{ margin: 0, fontSize: '28px', color: '#f8fafc', fontWeight: 900 }}>{pendingTasksCount}</p>
                </div>
              </div>

              <div style={{ backgroundColor: '#1e1a3b', padding: '20px', borderRadius: '16px', border: '1px solid #31285c', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                  <CheckSquare size={32} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>Thói quen đã check</p>
                  <p style={{ margin: 0, fontSize: '28px', color: '#f8fafc', fontWeight: 900 }}>{completedTrackingCount} <span style={{fontSize: '18px', color: '#64748b'}}>/ {trackItems.length}</span></p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ backgroundColor: '#1e1a3b', padding: '32px', borderRadius: '16px', border: '1px solid #31285c', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
                  <Quote size={120} color="rgba(139, 92, 246, 0.1)" style={{ position: 'absolute', top: '-15px', left: '-15px', zIndex: 0 }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                     <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#a78bfa', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Cảm hứng mỗi ngày</h3>
                     <p style={{ fontSize: '22px', color: '#f8fafc', lineHeight: 1.6, fontStyle: 'italic', fontWeight: 600 }}>
                       "{quoteOfDay.split('–')[0]?.trim()}"
                     </p>
                     {quoteOfDay.split('–')[1] && (
                       <p style={{ textAlign: 'right', color: '#94a3b8', marginTop: '16px', fontWeight: 700, fontSize: '16px' }}>— {quoteOfDay.split('–')[1]?.trim()}</p>
                     )}
                  </div>
                </div>

                <div style={{ backgroundColor: '#1e1a3b', padding: '24px', borderRadius: '16px', border: '1px solid #31285c', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <AlertCircle size={24} color="#ef4444" />
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Việc cần làm gấp (Hạn ≤ 3 ngày)</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {urgentTasks.length > 0 ? urgentTasks.map(task => {
                      const daysLeft = getDaysRemaining(task.deadline);
                      const bgColor = getDeadlineColor(daysLeft);
                      return (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#27224f', border: '1px solid #4c3e8c' }}>
                          <button onClick={() => handleToggleTask(task.id)} style={{ flexShrink: 0, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}><Circle size={24} color="#ef4444" /></button>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '16px', color: '#f8fafc', fontWeight: 700, margin: '0 0 8px 0' }}>{task.text}</p>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', backgroundColor: '#16122e', color: '#a78bfa', padding: '4px 8px', borderRadius: '6px' }}>{task.category}</span>
                              <span style={{ fontSize: '13px', fontWeight: 700, backgroundColor: bgColor, color: '#fff', padding: '4px 8px', borderRadius: '6px' }}>
                                {daysLeft < 0 ? ('Quá hạn ' + Math.abs(daysLeft) + 'd') : daysLeft === 0 ? 'Hôm nay' : (daysLeft + 'd')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }) : <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}><p style={{fontSize: '16px', fontWeight: 600}}>Tuyệt vời! Không có việc gấp.</p></div>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                 {/* Widget Pomodoro CỐ ĐỊNH ở Dashboard */}
                 <div style={{ backgroundColor: '#1e1a3b', borderRadius: '16px', border: `1px solid ${pomodoroMode === 'work' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`, boxShadow: `0 4px 6px rgba(0,0,0,0.3), inset 0 0 20px ${pomodoroMode === 'work' ? 'rgba(244, 63, 94, 0.05)' : 'rgba(56, 189, 248, 0.05)'}`, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.3s ease' }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '16px'}}>
                     <span style={{color: '#e2e8f0', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                       <Clock size={16} color={pomodoroMode === 'work' ? '#f43f5e' : '#38bdf8'} />
                       {pomodoroMode === 'work' ? 'TẬP TRUNG' : 'GIẢI LAO'}
                     </span>
                     <select 
                       value={pomoSetting} 
                       onChange={(e) => setPomoSetting(Number(e.target.value))}
                       style={{ background: 'transparent', border: 'none', color: '#a78bfa', fontSize: '14px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                     >
                       <option value={25} style={{backgroundColor: '#1e1a3b'}}>25 Phút</option>
                       <option value={90} style={{backgroundColor: '#1e1a3b'}}>90 Phút</option>
                     </select>
                  </div>

                  <div style={{ fontSize: '48px', fontWeight: 900, color: pomodoroMode === 'work' ? '#f43f5e' : '#38bdf8', fontVariantNumeric: 'tabular-nums', letterSpacing: '2px', textShadow: `0 0 15px ${pomodoroMode === 'work' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`, marginBottom: '20px' }}>
                    {formatPomodoroTime(pomodoroTime)}
                  </div>

                  <div style={{display: 'flex', gap: '16px'}}>
                     <button onClick={() => setIsPomodoroActive(!isPomodoroActive)} style={{ background: pomodoroMode === 'work' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pomodoroMode === 'work' ? '#f43f5e' : '#38bdf8', cursor: 'pointer', transition: 'all 0.2s' }}>
                       {isPomodoroActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '4px' }} />}
                     </button>
                     <button onClick={() => { setIsPomodoroActive(false); setPomodoroTime(pomodoroMode === 'work' ? pomoSetting * 60 : (pomoSetting === 25 ? 5 * 60 : 15 * 60)); }} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', transition: 'all 0.2s' }}>
                       <RotateCcw size={20} />
                     </button>
                  </div>
                </div>

                 <SimpleCalendar currentMonth={currentMonth} selectedDate={selectedDate} onDateSelect={setSelectedDate} onMonthChange={setCurrentMonth} />
                 
                 <div style={{ backgroundColor: '#1e1a3b', padding: '20px', borderRadius: '16px', border: '1px solid #31285c', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #2d2454' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Lịch trình: {formatDateVN(selectedDateStr)}</h3>
                      {currentWeekNum && <span style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: 700, backgroundColor: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Tuần {currentWeekNum}</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
                       {!hasAnyAgenda ? (
                          <div style={{ padding: '32px 0', textAlign: 'center' }}>
                             <PartyPopper size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
                             <p style={{ color: '#94a3b8', fontSize: '15px', fontWeight: 600 }}>Tuyệt vời, bạn rảnh nguyên ngày! 🎉</p>
                          </div>
                       ) : (
                          <>
                            {/* Render Lịch Học */}
                            {agendaClasses.map((cls, idx) => (
                               <div key={`cls-${idx}`} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '10px', backgroundColor: '#27224f', borderLeft: '4px solid #38bdf8' }}>
                                 <BookOpen size={18} color="#38bdf8" style={{ marginTop: '2px' }}/>
                                 <div>
                                   <p style={{ color: '#f8fafc', margin: '0 0 4px 0', fontWeight: 700, fontSize: '15px' }}>{cls.name}</p>
                                   <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px', fontWeight: 500 }}>{cls.period ? `Tiết ${cls.period} • ` : ''}{cls.time} • Phòng: {cls.room}</p>
                                 </div>
                               </div>
                            ))}

                            {/* Render Lịch Thi */}
                            {agendaExams.map(exam => (
                               <div key={exam.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '10px', backgroundColor: '#27224f', borderLeft: '4px solid #ef4444' }}>
                                 <GraduationCap size={18} color="#ef4444" style={{ marginTop: '2px' }}/>
                                 <div>
                                   <p style={{ color: '#f8fafc', margin: '0 0 4px 0', fontWeight: 700, fontSize: '15px' }}>Thi: {exam.subject}</p>
                                   <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px', fontWeight: 500 }}>{exam.startTime} {exam.duration ? `(${exam.duration}p)` : ''} • Phòng: {exam.room}</p>
                                 </div>
                               </div>
                            ))}

                            {/* Render Sự kiện */}
                            {agendaEvents.map(evt => {
                               const badgeStyle = getEventBadgeStyle(evt.type);
                               return (
                                 <div key={evt.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '10px', backgroundColor: '#27224f', borderLeft: `4px solid ${badgeStyle.text}` }}>
                                   <CalendarIcon size={18} color={badgeStyle.text} style={{ marginTop: '2px' }}/>
                                   <div>
                                     <p style={{ color: '#f8fafc', margin: '0 0 4px 0', fontWeight: 700, fontSize: '15px' }}>{evt.title}</p>
                                     <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px', fontWeight: 500 }}>{evt.time ? `${evt.time} • ` : ''}{evt.location || 'Không có địa điểm'}</p>
                                   </div>
                                 </div>
                               )
                            })}

                            {/* Render Deadline Tasks */}
                            {agendaTasks.map(task => (
                               <div key={task.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '10px', backgroundColor: '#27224f', borderLeft: '4px solid #fbbf24' }}>
                                 <AlertCircle size={18} color="#fbbf24" style={{ marginTop: '2px' }}/>
                                 <div>
                                   <p style={{ color: '#f8fafc', margin: '0 0 4px 0', fontWeight: 700, fontSize: '15px' }}>Hạn chót: {task.text}</p>
                                   <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px', fontWeight: 500 }}>Mục: {task.category}</p>
                                 </div>
                               </div>
                            ))}
                          </>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: MY TASKS --- */}
        {currentView === 'my-tasks' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
              
              <div style={{ flex: '0 0 70%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ backgroundColor: '#1e1a3b', padding: '24px', borderRadius: '16px', border: '1px solid #31285c', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Danh sách công việc ({tasks.filter(t => !t.completed).length})</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                    {tasks.length > 0 ? tasks.map(task => {
                      const daysLeft = getDaysRemaining(task.deadline);
                      const bgColor = getDeadlineColor(daysLeft);
                      return (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#27224f', border: '1px solid #31285c' }}>
                          <button onClick={() => handleToggleTask(task.id)} style={{ flexShrink: 0, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                            {task.completed ? <CheckCircle2 size={24} color="#8b5cf6" /> : <Circle size={24} color="#4c3e8c" />}
                          </button>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '16px', color: task.completed ? '#64748b' : '#f8fafc', textDecoration: task.completed ? 'line-through' : 'none', fontWeight: task.completed ? 500 : 700, margin: '0 0 8px 0' }}>{task.text}</p>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', backgroundColor: '#16122e', color: '#a78bfa', padding: '4px 8px', borderRadius: '6px', border: '1px solid #31285c', fontWeight: 600 }}>{task.category}</span>
                              {task.deadline && <span style={{ fontSize: '13px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#c4b5fd', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>{formatDateVN(task.deadline)}</span>}
                              {daysLeft !== null && <span style={{ fontSize: '13px', fontWeight: 700, backgroundColor: bgColor, color: '#fff', padding: '4px 8px', borderRadius: '6px' }}>{daysLeft < 0 ? ('Quá hạn ' + Math.abs(daysLeft) + 'd') : daysLeft === 0 ? 'Hôm nay' : (daysLeft + 'd')}</span>}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteTask(task.id)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.7 }}><Trash2 size={20} /></button>
                        </div>
                      );
                    }) : <p style={{ fontSize: '15px', color: '#64748b', textAlign: 'center', padding: '24px 0', fontWeight: 600 }}>Chưa có công việc nào</p>}
                  </div>
                </div>

                <form onSubmit={handleAddTask} style={{ background: 'linear-gradient(to right, rgba(139, 92, 246, 0.05), rgba(168, 85, 247, 0.05))', padding: '24px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '20px', margin: 0, paddingBottom: '12px' }}>Thêm công việc mới</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Công việc tiếp theo của bạn là gì?" style={{ width: '100%', fontSize: '15px', padding: '16px', borderRadius: '10px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontWeight: 500 }} />
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} style={{ flex: 1, fontSize: '15px', padding: '16px', borderRadius: '10px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontWeight: 500 }} />
                      <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ flex: 1, padding: '16px', borderRadius: '10px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', fontSize: '15px', fontWeight: 600 }}>
                        {categories.map(cat => <option key={cat} value={cat}>{categoryEmojis[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                      </select>
                      <button type="submit" disabled={!newTask.trim() || !newDeadline} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', backgroundColor: (newTask.trim() && newDeadline) ? '#8b5cf6' : '#31285c', color: (newTask.trim() && newDeadline) ? '#fff' : '#64748b', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, border: 'none', cursor: (newTask.trim() && newDeadline) ? 'pointer' : 'default', transition: 'all 0.2s' }}><Plus size={20} /> Thêm</button>
                    </div>
                  </div>
                </form>
              </div>

              <div style={{ flex: '0 0 28%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '12px' }}>
                <div style={{ backgroundColor: '#1e1a3b', padding: '24px', borderRadius: '16px', border: '1px solid #31285c', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '20px', margin: 0, paddingBottom: '12px' }}>Theo dõi thói quen</h3>
                  <form onSubmit={handleAddTrack} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <input type="text" value={newTrack} onChange={(e) => setNewTrack(e.target.value)} placeholder="Bạn muốn theo dõi gì?" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '14px', fontWeight: 500 }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select value={newTrackMode} onChange={(e) => setNewTrackMode(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '14px', fontWeight: 600 }}><option value="daily">Hàng ngày</option><option value="once">Một lần</option></select>
                      <button type="submit" style={{ padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#8b5cf6', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Thêm</button>
                    </div>
                  </form>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                    {trackItems.length === 0 ? <p style={{ fontSize: '14px', color: '#64748b', margin: 0, textAlign: 'center', padding: '16px 0', fontWeight: 500 }}>Chưa có mục theo dõi</p> : trackItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: item.done ? 'rgba(34, 197, 94, 0.1)' : '#27224f', border: item.done ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #31285c' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={item.done} onChange={() => handleToggleTrack(item.id)} style={{ accentColor: '#8b5cf6', width: '18px', height: '18px' }} />
                          <span style={{ color: item.done ? '#64748b' : '#e2e8f0', textDecoration: item.done ? 'line-through' : 'none', fontSize: '15px', fontWeight: 500 }}>{item.text}</span>
                        </label>
                        <button onClick={async () => await deleteDoc(doc(db, 'users', user.uid, 'tracking', item.id))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.7 }}><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: CALENDAR --- */}
        {currentView === 'calendar' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #2d2454', backgroundColor: '#1e1a3b', padding: '0 32px' }}>
              {[
                { id: 'study', label: 'Lịch học', icon: BookOpen },
                { id: 'exam', label: 'Lịch thi', icon: GraduationCap },
                { id: 'event', label: 'Sự kiện', icon: PartyPopper }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCalendarTab(tab.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 24px', backgroundColor: 'transparent', border: 'none', borderBottom: calendarTab === tab.id ? '3px solid #8b5cf6' : '3px solid transparent', color: calendarTab === tab.id ? '#8b5cf6' : '#94a3b8', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontSize: '16px' }}>
                  <tab.icon size={20} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              {calendarTab === 'study' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#1e1a3b', padding: '8px 16px', borderRadius: '12px', border: '1px solid #31285c' }}>
                        <button onClick={handlePrevWeek} style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={24} /></button>
                        <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '16px', minWidth: '160px', textAlign: 'center' }}>
                          Tháng {selectedDate.getMonth() + 1} / {selectedDate.getFullYear()}
                        </span>
                        <button onClick={handleNextWeek} style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={24} /></button>
                      </div>

                      {currentWeekNum && (
                         <span style={{ fontSize: '14px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#d8b4fe', padding: '8px 16px', borderRadius: '8px', fontWeight: 700 }}>
                           Tuần {currentWeekNum}
                         </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setShowManualClassModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#a78bfa', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, border: '1px solid #a78bfa', cursor: 'pointer', fontSize: '15px' }}>
                        <Plus size={18} /> Thêm thủ công
                      </button>
                      <button onClick={() => setShowMyBKModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(to right, #7c3aed, #a855f7)', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(124, 58, 237, 0.3)', fontSize: '15px' }}>
                        <Download size={18} /> Đồng bộ MyBK
                      </button>
                    </div>
                  </div>
                  
                  {timetableData.classes?.length === 0 || !timetableData.semesterStart ? (
                    <div style={{ textAlign: 'center', padding: '64px', backgroundColor: '#1e1a3b', borderRadius: '16px', border: '2px dashed #4c3e8c' }}>
                      <BookOpen size={48} color="#4c3e8c" style={{ margin: '0 auto 16px' }} />
                      <h3 style={{ color: '#f8fafc', fontSize: '20px', marginBottom: '8px', fontWeight: 800 }}>Chưa có dữ liệu Thời khóa biểu</h3>
                      <p style={{ color: '#94a3b8', fontSize: '16px' }}>Hãy nhấn nút Đồng bộ bên trên để dán dữ liệu từ MyBK vào hệ thống nhé.</p>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '70px repeat(7, 1fr)', 
                      gridTemplateRows: '60px repeat(12, 75px)', 
                      backgroundColor: '#1e1a3b', 
                      borderRadius: '16px', 
                      border: '1px solid #31285c', 
                      overflowX: 'auto',
                      minWidth: '900px'
                    }}>
                      
                      <div style={{ gridColumn: 1, gridRow: 1, borderRight: '1px solid #31285c', borderBottom: '1px solid #31285c' }}></div>
                      
                      {daysOfWeekLabels.map((dayLabel, idx) => (
                        <div key={idx} style={{ 
                          gridColumn: idx + 2, gridRow: 1,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                          borderBottom: '1px solid #31285c', borderRight: idx < 6 ? '1px solid #31285c' : 'none',
                          padding: '8px'
                        }}>
                          <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '16px' }}>{dayLabel}</span>
                          <span style={{ color: '#a78bfa', fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{weekDates[idx].getDate()}/{weekDates[idx].getMonth() + 1}</span>
                        </div>
                      ))}

                      {Array.from({length: 12}).map((_, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                          <div style={{ 
                            gridColumn: 1, gridRow: rowIndex + 2,
                            borderRight: '1px solid #31285c', borderBottom: rowIndex < 11 ? '1px solid #31285c' : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#94a3b8', fontSize: '15px', fontWeight: 700
                          }}>
                            Tiết {rowIndex + 1}
                          </div>
                          
                          {Array.from({length: 7}).map((_, colIndex) => (
                            <div key={`${rowIndex}-${colIndex}`} style={{ 
                              gridColumn: colIndex + 2, gridRow: rowIndex + 2,
                              borderBottom: rowIndex < 11 ? '1px solid rgba(49, 40, 92, 0.5)' : 'none',
                              borderRight: colIndex < 6 ? '1px solid rgba(49, 40, 92, 0.5)' : 'none',
                              backgroundColor: '#16122e'
                            }}></div>
                          ))}
                        </React.Fragment>
                      ))}

                      {activeClassesThisWeek.map((cls, idx) => {
                        const periodInfo = parsePeriodToGrid(cls.period);
                        const colIndex = getDayColumnIndex(cls.day);
                        return (
                          <div key={idx} style={{
                            gridRow: `${periodInfo.start + 1} / span ${periodInfo.span}`,
                            gridColumn: colIndex,
                            backgroundColor: cls.isManual ? 'rgba(244, 63, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                            borderLeft: `5px solid ${cls.isManual ? '#f43f5e' : '#8b5cf6'}`,
                            borderRadius: '8px',
                            margin: '4px',
                            padding: '12px',
                            zIndex: 10,
                            display: 'flex', flexDirection: 'column', gap: '6px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            position: 'relative'
                          }}>
                            {cls.isManual && (
                               <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }} style={{ position: 'absolute', top: '6px', right: '6px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.8 }}><Trash2 size={16}/></button>
                            )}
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3, paddingRight: cls.isManual ? '20px' : '0' }}>{cls.name}</span>
                            {periodInfo.span > 1 && (
                              <>
                                {cls.time && <span style={{ fontSize: '13px', color: cls.isManual ? '#f43f5e' : '#a78bfa', fontWeight: 600 }}>{cls.time}</span>}
                                {cls.room && <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 700 }}>Phòng {cls.room}</span>}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {calendarTab === 'exam' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '20px', fontWeight: 800 }}>Lịch Thi & Kiểm Tra</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setShowManualExamModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#a78bfa', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, border: '1px solid #a78bfa', cursor: 'pointer', fontSize: '15px' }}>
                        <Plus size={18} /> Thêm thủ công
                      </button>
                      <button onClick={() => setShowExamSyncModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(to right, #7c3aed, #a855f7)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '15px' }}>
                        <Download size={18} /> Đồng bộ MyBK
                      </button>
                    </div>
                  </div>

                  {exams.length === 0 ? (
                     <div style={{ textAlign: 'center', padding: '64px', backgroundColor: '#1e1a3b', borderRadius: '16px', border: '2px dashed #4c3e8c' }}>
                       <GraduationCap size={48} color="#4c3e8c" style={{ margin: '0 auto 16px' }} />
                       <h3 style={{ color: '#f8fafc', fontSize: '20px', marginBottom: '8px', fontWeight: 800 }}>Chưa có Lịch Thi</h3>
                       <p style={{ color: '#94a3b8', fontSize: '16px' }}>Đồng bộ từ MyBK hoặc tự thêm thủ công để theo dõi lịch thi cử của bạn.</p>
                     </div>
                  ) : (
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                       {sortedExams.map(exam => {
                          const daysLeft = getDaysRemaining(exam.date);
                          const isPast = daysLeft !== null && daysLeft < 0;
                          return (
                            <div key={exam.id} style={{ backgroundColor: '#1e1a3b', padding: '20px', borderRadius: '16px', border: '1px solid #31285c', position: 'relative', opacity: isPast ? 0.6 : 1 }}>
                               <button onClick={() => handleDeleteExam(exam.id)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.8 }}><Trash2 size={18}/></button>
                               <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                  <span style={{ fontSize: '13px', backgroundColor: exam.type === 'GK' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(244, 63, 94, 0.15)', color: exam.type === 'GK' ? '#38bdf8' : '#f43f5e', padding: '4px 10px', borderRadius: '6px', fontWeight: 800 }}>
                                    {exam.type === 'GK' ? 'GIỮA KỲ' : exam.type === 'CK' ? 'CUỐI KỲ' : exam.type}
                                  </span>
                                  {exam.isManual && <span style={{ fontSize: '13px', backgroundColor: '#2d2454', color: '#cbd5e1', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>Thủ công</span>}
                               </div>
                               <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 16px 0', paddingRight: '32px', lineHeight: 1.4 }}>{exam.subject}</h4>
                               
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '15px', fontWeight: 500 }}>
                                   <span>Ngày thi:</span> <strong style={{ color: '#e2e8f0', fontWeight: 700 }}>{formatDateVN(exam.date)}</strong>
                                 </div>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '15px', fontWeight: 500 }}>
                                   <span>Giờ bắt đầu:</span> <strong style={{ color: '#e2e8f0', fontWeight: 700 }}>{exam.startTime} {exam.duration ? `(${exam.duration}p)` : ''}</strong>
                                 </div>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '15px', fontWeight: 500 }}>
                                   <span>Phòng thi:</span> <strong style={{ color: '#fde047', fontWeight: 800 }}>{exam.room}</strong>
                                 </div>
                               </div>

                               {!isPast && daysLeft !== null && (
                                 <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #31285c', textAlign: 'center' }}>
                                   <span style={{ fontSize: '15px', fontWeight: 800, color: daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#eab308' : '#22c55e' }}>
                                     {daysLeft === 0 ? 'Thi vào hôm nay!' : `Còn ${daysLeft} ngày nữa`}
                                   </span>
                                 </div>
                               )}
                            </div>
                          )
                       })}
                     </div>
                  )}
                </div>
              )}

              {calendarTab === 'event' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '20px', fontWeight: 800 }}>Sự kiện Cá nhân</h3>
                    <button onClick={() => setShowEventModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(to right, #7c3aed, #a855f7)', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '15px' }}>
                      <Plus size={18} /> Thêm sự kiện
                    </button>
                  </div>

                  {events.length === 0 ? (
                     <div style={{ textAlign: 'center', padding: '64px', backgroundColor: '#1e1a3b', borderRadius: '16px', border: '2px dashed #4c3e8c' }}>
                       <PartyPopper size={48} color="#4c3e8c" style={{ margin: '0 auto 16px' }} />
                       <h3 style={{ color: '#f8fafc', fontSize: '20px', marginBottom: '8px', fontWeight: 800 }}>Chưa có Sự kiện</h3>
                       <p style={{ color: '#94a3b8', fontSize: '16px' }}>Thêm lịch hội thảo, training, hoặc làm việc nhóm vào đây nhé.</p>
                     </div>
                  ) : (
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                       {sortedEvents.map(evt => {
                          const daysLeft = getDaysRemaining(evt.date);
                          const isPast = daysLeft !== null && daysLeft < 0;
                          const badgeStyle = getEventBadgeStyle(evt.type);
                          
                          return (
                            <div key={evt.id} style={{ backgroundColor: '#1e1a3b', padding: '20px', borderRadius: '16px', border: '1px solid #31285c', position: 'relative', opacity: isPast ? 0.6 : 1, display: 'flex', flexDirection: 'column' }}>
                               <button onClick={() => handleDeleteEvent(evt.id)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.8 }}><Trash2 size={18}/></button>
                               <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                  <span style={{ fontSize: '13px', backgroundColor: badgeStyle.bg, color: badgeStyle.text, padding: '4px 10px', borderRadius: '6px', fontWeight: 800 }}>
                                    {evt.type}
                                  </span>
                               </div>
                               <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 16px 0', paddingRight: '24px', lineHeight: 1.4 }}>{evt.title}</h4>
                               
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '15px', fontWeight: 500 }}>
                                   <CalendarIcon size={18} color="#64748b" />
                                   <strong style={{ color: '#e2e8f0', fontWeight: 700 }}>{formatDateVN(evt.date)}</strong>
                                 </div>
                                 {evt.time && (
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '15px', fontWeight: 500 }}>
                                     <Clock size={18} color="#64748b" />
                                     <strong style={{ color: '#e2e8f0', fontWeight: 700 }}>{evt.time}</strong>
                                   </div>
                                 )}
                                 {evt.location && (
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '15px', fontWeight: 500 }}>
                                     <MapPin size={18} color="#64748b" />
                                     <strong style={{ color: '#e2e8f0', fontWeight: 700 }}>{evt.location}</strong>
                                   </div>
                                 )}
                               </div>

                               {!isPast && daysLeft !== null && (
                                 <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #31285c', textAlign: 'center' }}>
                                   <span style={{ fontSize: '15px', fontWeight: 800, color: daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#eab308' : '#22c55e' }}>
                                     {daysLeft === 0 ? 'Diễn ra hôm nay!' : `Còn ${daysLeft} ngày`}
                                   </span>
                                 </div>
                               )}
                            </div>
                          )
                       })}
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL NHẬP LIỆU TKB --- */}
      {showMyBKModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e1a3b', width: '600px', maxWidth: '90%', padding: '32px', borderRadius: '24px', border: '1px solid #4c3e8c', boxShadow: '0 20px 25px rgba(0,0,0,0.5)', position: 'relative' }}>
            <button onClick={() => setShowMyBKModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Download color="#8b5cf6" /> Đồng bộ TKB từ MyBK
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
              <b>Hướng dẫn:</b> Đăng nhập trang MyBK &gt; Thời khóa biểu. Bôi đen toàn bộ từ chữ "HỌC KỲ" đến hết bảng, ấn Copy (Ctrl+C) và Paste (Ctrl+V) vào ô dưới đây.
            </p>
            <textarea 
              value={rawTKB} onChange={handleRawTKBChange} placeholder="Dán thời khóa biểu vào đây..."
              style={{ width: '100%', height: '160px', padding: '16px', borderRadius: '12px', border: '1px dashed #8b5cf6', backgroundColor: '#16122e', color: '#f8fafc', fontSize: '15px', outline: 'none', resize: 'none', marginBottom: '16px', fontFamily: 'monospace' }}
            />
            {autoDetected ? (
              <div style={{ marginBottom: '24px', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <p style={{ color: '#4ade80', fontSize: '15px', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={20} /> Tự động tính được Tuần 1 bắt đầu từ: {semesterStart.split('-').reverse().join('/')}</p>
              </div>
            ) : (
              <div style={{ marginBottom: '24px', backgroundColor: '#27224f', padding: '16px', borderRadius: '12px', border: '1px solid #31285c' }}>
                 <label style={{ color: '#cbd5e1', fontSize: '15px', display: 'block', marginBottom: '8px', fontWeight: 700 }}>Ngày bắt đầu Tuần 1 (Thứ 2):</label>
                 <input type="date" value={semesterStart} onChange={e => setSemesterStart(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px' }} />
              </div>
            )}
            <button onClick={handleSaveTKB} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(to right, #7c3aed, #a855f7)', color: '#fff', padding: '16px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '16px' }}>Phân tích & Lưu Lịch học</button>
          </div>
        </div>
      )}

      {/* --- MODAL THÊM LỊCH HỌC THỦ CÔNG --- */}
      {showManualClassModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e1a3b', width: '500px', maxWidth: '90%', padding: '32px', borderRadius: '24px', border: '1px solid #4c3e8c', boxShadow: '0 20px 25px rgba(0,0,0,0.5)', position: 'relative' }}>
            <button onClick={() => setShowManualClassModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Plus color="#a78bfa" size={28} /> Thêm Môn học
            </h2>
            <form onSubmit={handleAddManualClass} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" value={manualClass.name} onChange={e => setManualClass({...manualClass, name: e.target.value})} placeholder="Tên môn học (Vd: Tối ưu hóa)" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px', fontWeight: 500 }} required />
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Thứ</label>
                  <select value={manualClass.day} onChange={e => setManualClass({...manualClass, day: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px', fontWeight: 600 }}>
                     {['2','3','4','5','6','7','CN'].map(d => <option key={d} value={d}>Thứ {d}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Tiết bắt đầu</label>
                  <select value={manualClass.startPeriod} onChange={e => setManualClass({...manualClass, startPeriod: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px', fontWeight: 600 }}>
                     {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>Tiết {i+1}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                 <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Số lượng tiết</label>
                  <select value={manualClass.span} onChange={e => setManualClass({...manualClass, span: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px', fontWeight: 600 }}>
                     {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} tiết</option>)}
                  </select>
                 </div>
                 <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Phòng học</label>
                  <input type="text" value={manualClass.room} onChange={e => setManualClass({...manualClass, room: e.target.value})} placeholder="Vd: H6-112" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px', fontWeight: 500 }} />
                 </div>
              </div>
              <button type="submit" disabled={!manualClass.name} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', color: (!manualClass.name) ? '#64748b' : '#a78bfa', padding: '16px', borderRadius: '12px', fontWeight: 800, border: (!manualClass.name) ? '2px solid #475569' : '2px solid #a78bfa', cursor: (!manualClass.name) ? 'default' : 'pointer', fontSize: '16px', marginTop: '8px', transition: 'all 0.2s' }}>Lưu Môn học</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ĐỒNG BỘ LỊCH THI --- */}
      {showExamSyncModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e1a3b', width: '600px', maxWidth: '90%', padding: '32px', borderRadius: '24px', border: '1px solid #4c3e8c', boxShadow: '0 20px 25px rgba(0,0,0,0.5)', position: 'relative' }}>
            <button onClick={() => setShowExamSyncModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Download color="#8b5cf6" size={28} /> Đồng bộ Lịch Thi từ MyBK
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
              <b>Hướng dẫn:</b> Bôi đen bảng Lịch thi từ "Học kỳ | Môn học..." đến hết. Copy và Paste vào ô dưới.
            </p>
            <textarea 
              value={rawExamText} onChange={(e) => setRawExamText(e.target.value)} placeholder="Dán lịch thi vào đây..."
              style={{ width: '100%', height: '160px', padding: '16px', borderRadius: '12px', border: '1px dashed #8b5cf6', backgroundColor: '#16122e', color: '#f8fafc', fontSize: '15px', outline: 'none', resize: 'none', marginBottom: '24px', fontFamily: 'monospace' }}
            />
            <button onClick={handleSaveExamSync} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(to right, #7c3aed, #a855f7)', color: '#fff', padding: '16px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '16px' }}>Lưu Lịch Thi</button>
          </div>
        </div>
      )}

      {/* --- MODAL THÊM LỊCH THI THỦ CÔNG --- */}
      {showManualExamModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e1a3b', width: '500px', maxWidth: '90%', padding: '32px', borderRadius: '24px', border: '1px solid #4c3e8c', boxShadow: '0 20px 25px rgba(0,0,0,0.5)', position: 'relative' }}>
            <button onClick={() => setShowManualExamModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Plus color="#a78bfa" size={28} /> Thêm Lịch thủ công
            </h2>
            <form onSubmit={handleAddManualExam} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" value={manualExam.subject} onChange={e => setManualExam({...manualExam, subject: e.target.value})} placeholder="Tên môn thi / Bài kiểm tra" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px' }} required />
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Ngày thi</label>
                  <input type="date" value={manualExam.date} onChange={e => setManualExam({...manualExam, date: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Loại</label>
                  <select value={manualExam.type} onChange={e => setManualExam({...manualExam, type: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px', fontWeight: 600 }}>
                     <option value="GK">Giữa kỳ</option>
                     <option value="CK">Cuối kỳ</option>
                     <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                 <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Giờ bắt đầu</label>
                  <input type="time" value={manualExam.startTime} onChange={e => setManualExam({...manualExam, startTime: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px' }} />
                 </div>
                 <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Phòng thi</label>
                  <input type="text" value={manualExam.room} onChange={e => setManualExam({...manualExam, room: e.target.value})} placeholder="Vd: H6-112" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px' }} />
                 </div>
              </div>
              <button type="submit" disabled={!manualExam.subject || !manualExam.date} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', color: (!manualExam.subject || !manualExam.date) ? '#64748b' : '#a78bfa', padding: '16px', borderRadius: '12px', fontWeight: 800, border: (!manualExam.subject || !manualExam.date) ? '2px solid #475569' : '2px solid #a78bfa', cursor: (!manualExam.subject || !manualExam.date) ? 'default' : 'pointer', fontSize: '16px', marginTop: '8px', transition: 'all 0.2s' }}>Xác nhận Thêm</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL THÊM SỰ KIỆN THỦ CÔNG --- */}
      {showEventModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e1a3b', width: '500px', maxWidth: '90%', padding: '32px', borderRadius: '24px', border: '1px solid #4c3e8c', boxShadow: '0 20px 25px rgba(0,0,0,0.5)', position: 'relative' }}>
            <button onClick={() => setShowEventModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <PartyPopper color="#a78bfa" size={28} /> Thêm Sự kiện mới
            </h2>
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" value={newEventObj.title} onChange={e => setNewEventObj({...newEventObj, title: e.target.value})} placeholder="Tên sự kiện (Vd: Training Coteccons)" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px' }} required />
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Ngày diễn ra</label>
                  <input type="date" value={newEventObj.date} onChange={e => setNewEventObj({...newEventObj, date: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Phân loại</label>
                  <select value={newEventObj.type} onChange={e => setNewEventObj({...newEventObj, type: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px', fontWeight: 600 }}>
                     <option value="Hội thảo">Hội thảo</option>
                     <option value="CLB/Đội nhóm">CLB / Đội nhóm</option>
                     <option value="Cá nhân">Cá nhân</option>
                     <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                 <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Thời gian</label>
                  <input type="time" value={newEventObj.time} onChange={e => setNewEventObj({...newEventObj, time: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px' }} />
                 </div>
                 <div style={{ flex: 1 }}>
                  <label style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: 700 }}>Địa điểm</label>
                  <input type="text" value={newEventObj.location} onChange={e => setNewEventObj({...newEventObj, location: e.target.value})} placeholder="Vd: Hội trường A5" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #4c3e8c', backgroundColor: '#16122e', color: '#f8fafc', outline: 'none', fontSize: '15px' }} />
                 </div>
              </div>
              <button type="submit" disabled={!newEventObj.title || !newEventObj.date} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', color: (!newEventObj.title || !newEventObj.date) ? '#64748b' : '#a78bfa', padding: '16px', borderRadius: '12px', fontWeight: 800, border: (!newEventObj.title || !newEventObj.date) ? '2px solid #475569' : '2px solid #a78bfa', cursor: (!newEventObj.title || !newEventObj.date) ? 'default' : 'pointer', fontSize: '16px', marginTop: '8px', transition: 'all 0.2s' }}>Lưu Sự kiện</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}