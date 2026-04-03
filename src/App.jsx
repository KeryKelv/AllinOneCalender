import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Circle, CheckCircle2, LogOut, Loader2, Target, Search, Calendar, Clock, Settings, Bell, Home } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
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

// Calendar Component
function SimpleCalendar({ currentMonth, selectedDate, onDateSelect, onMonthChange }) {
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Convert to Monday-first week
  const days = [];
  
  for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth(currentMonth); i++) days.push(i);
  
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  
  const calendarStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px'
  };
  
  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} style={{ padding: '4px 8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}>←</button>
          <button onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} style={{ padding: '4px 8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}>→</button>
        </div>
      </div>
      <div style={{ ...calendarStyle, marginBottom: '8px' }}>
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{day}</div>
        ))}
      </div>
      <div style={calendarStyle}>
        {days.map((day, idx) => (
          <button 
            key={idx} 
            onClick={() => day && onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
            style={{
              padding: '8px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              cursor: day ? 'pointer' : 'default',
              backgroundColor: day === selectedDate?.getDate() && currentMonth.getMonth() === selectedDate?.getMonth() ? '#fbbf24' : day ? '#fff' : '#f1f5f9',
              color: day === selectedDate?.getDate() && currentMonth.getMonth() === selectedDate?.getMonth() ? '#0f172a' : day ? '#334155' : '#cbd5e1',
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

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('work');
  const [newDeadline, setNewDeadline] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeTracking, setTimeTracking] = useState({});

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
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      taskList.sort((a, b) => a.createdAt - b.createdAt);
      setTasks(taskList);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    if (!isConfigValid) return;
    try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    if (!isConfigValid) return;
    await signOut(auth);
    setTasks([]);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !newDeadline || !user || !isConfigValid) return;
    const taskId = Date.now().toString();
    const taskData = { 
      text: newTask.trim(), 
      completed: false, 
      category: newCategory,
      dueDate: selectedDate.toISOString().split('T')[0],
      deadline: newDeadline,
      createdAt: Date.now() 
    };
    await setDoc(doc(db, 'users', user.uid, 'tasks', taskId), taskData);
    setNewTask('');
    setNewDeadline('');
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

  if (!isConfigValid) {
    return (
      <div style={{ height: '100vh', width: '100vw', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.7)', padding: '32px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(244,63,94,0.1)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>Lỗi API Key</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Vui lòng thay Firebase Config trong file App.jsx</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ height: '100vh', width: '100vw', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#4f46e5', marginBottom: '16px' }} size={40} />
    </div>;
  }

  if (!user) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: 'linear-gradient(to bottom right, #4f46e5 0%, #7c3aed 50%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflow: 'hidden', position: 'relative', fontFamily: 'system-ui' }}>
        <div style={{ position: 'absolute', top: '80px', left: '40px', width: '288px', height: '288px', backgroundColor: 'rgba(79, 70, 229, 0.2)', borderRadius: '9999px', filter: 'blur(96px)' }}></div>
        <div style={{ position: 'absolute', bottom: '80px', right: '40px', width: '320px', height: '320px', backgroundColor: 'rgba(168, 85, 247, 0.2)', borderRadius: '9999px', filter: 'blur(96px)' }}></div>
        
        <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '48px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', boxShadow: '0 20px 25px rgba(0,0,0,0.2)', maxWidth: '512px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '96px', height: '96px', background: 'linear-gradient(to bottom right, rgba(79, 70, 229, 1), rgba(168, 85, 247, 1))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 20px 25px rgba(79, 70, 229, 0.5)' }}>
                <Target size={48} strokeWidth={2} />
              </div>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', marginBottom: '12px', letterSpacing: '-0.02em' }}>Kế hoạch BK</h1>
            <p style={{ color: '#e0e7ff', fontSize: '16px', marginBottom: '40px', fontWeight: 500 }}>Quản lý công việc hiệu quả</p>
            <div style={{ backgroundColor: 'rgba(79, 70, 229, 0.2)', padding: '24px', borderRadius: '16px', marginBottom: '32px', border: '1px solid rgba(79, 70, 229, 0.3)', backdropFilter: 'blur(8px)' }}>
              <button onClick={handleLogin} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'linear-gradient(to right, rgb(79, 70, 229), rgb(139, 92, 246))', color: '#fff', padding: '16px 24px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '16px', boxShadow: '0 20px 25px rgba(79, 70, 229, 0.5)', transition: 'all 0.3s', transform: 'scale(1)' }}>
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                </svg>
                Đăng nhập với Google
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const categoryEmojis = { work: '💼', personal: '🎯' };
  const categories = ['work', 'personal'];
  const tasksByCategory = categories.map(cat => ({ name: cat, emoji: categoryEmojis[cat], count: tasks.filter(t => t.category === cat).length }));
  const completedTasks = tasks.filter(t => t.completed).length;
  const todayTasks = tasks.filter(t => !t.completed && t.dueDate === selectedDate.toISOString().split('T')[0]);

  // Calculate days remaining and warning color
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const getDeadlineColor = (daysLeft) => {
    if (daysLeft === null) return '#e5e7eb';
    if (daysLeft < 0) return '#dc2626'; // Red - overdue
    if (daysLeft === 0) return '#ea580c'; // Dark orange - today
    if (daysLeft <= 3) return '#fa8c16'; // Orange - 1-3 days
    if (daysLeft <= 7) return '#faad14'; // Yellow - 1-7 days
    return '#52c41a'; // Green - more than 7 days
  };

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'linear-gradient(to bottom right, #f1f5f9 0%, #eef2ff 100%)', display: 'flex', fontFamily: 'system-ui', overflow: 'hidden' }}>
      {/* ===== SIDEBAR ===== */}
      <div style={{ width: '256px', background: 'linear-gradient(to bottom, #0f172a, #1e293b)', color: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(100, 116, 139, 0.3)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><span>📋</span> Kế hoạch</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{user?.displayName || user?.email}</p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'my-tasks', label: 'My tasks', icon: Circle }
          ].map(item => (
            <button key={item.id} onClick={() => {}} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#cbd5e1', transition: 'all 0.2s', fontWeight: 500 }}>
              {item.id === 'dashboard' && <Home size={20} />}
              {item.id === 'my-tasks' && <Circle size={20} />}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(100, 116, 139, 0.3)' }}>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#cbd5e1', transition: 'all 0.2s' }}>
            <LogOut size={20} /> Log out
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 900, background: 'linear-gradient(to right, #4f46e5, #7c3aed)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Dashboard</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input type="text" placeholder="Search..." style={{ paddingLeft: '40px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
            {/* Left Column: Calendar - 1/4 */}
            <div style={{ flex: '0 0 25%', minWidth: 0 }}>
              <SimpleCalendar currentMonth={currentMonth} selectedDate={selectedDate} onDateSelect={setSelectedDate} onMonthChange={setCurrentMonth} />
            </div>

            {/* Middle Column: Tasks - 1/2 */}
            <div style={{ flex: '0 0 50%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* My Tasks */}
              <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>My tasks ({tasks.filter(t => !t.completed).length})</h3>
                  <button style={{ color: '#4f46e5', fontWeight: 700, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px' }}>+ New task</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {todayTasks.length > 0 ? todayTasks.map(task => {
                    const daysLeft = getDaysRemaining(task.deadline);
                    const bgColor = getDeadlineColor(daysLeft);
                    return (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#f9fafb' }}>
                        <button onClick={() => handleToggleTask(task.id)} style={{ flexShrink: 0, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                          {task.completed ? <CheckCircle2 size={20} color="#4f46e5" /> : <Circle size={20} color="#cbd5e1" />}
                        </button>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: task.completed ? '#94a3b8' : '#0f172a', textDecoration: task.completed ? 'line-through' : 'none', fontWeight: task.completed ? 400 : 500, margin: '0 0 4px 0' }}>{task.text}</p>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', backgroundColor: '#e5e7eb', color: '#6b7280', padding: '2px 6px', borderRadius: '4px' }}>{task.category}</span>
                            {daysLeft !== null && (
                              <span style={{ fontSize: '11px', backgroundColor: bgColor, color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                                {daysLeft < 0 ? `Quá hạn ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Hôm nay' : `${daysLeft}d`}
                              </span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteTask(task.id)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#cbd5e1', transition: 'all 0.2s' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  }) : (
                    <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>No tasks for today</p>
                  )}
                </div>
              </div>

              {/* Add Task Form */}
              <form onSubmit={handleAddTask} style={{ background: 'linear-gradient(to right, rgba(79, 70, 229, 0.05), rgba(139, 92, 246, 0.05))', padding: '24px', borderRadius: '16px', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '16px', margin: 0, paddingBottom: '16px' }}>Add New Task</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="What's your next task?" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(79, 70, 229, 0.5)', backgroundColor: '#fff', outline: 'none' }} />
                  <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(79, 70, 229, 0.5)', backgroundColor: '#fff', outline: 'none' }} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(79, 70, 229, 0.5)', backgroundColor: '#fff', fontSize: '14px' }}>
                      {categories.map(cat => <option key={cat} value={cat}>{categoryEmojis[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                    </select>
                    <button type="submit" disabled={!newTask.trim() || !newDeadline} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: (newTask.trim() && newDeadline) ? '#4f46e5' : '#cbd5e1', color: '#fff', padding: '8px 24px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: (newTask.trim() && newDeadline) ? 'pointer' : 'default', transition: 'all 0.2s' }}>
                      <Plus size={20} /> Add
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Categories & Tracking - 1/4 */}
            <div style={{ flex: '0 0 25%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* My Categories */}
              <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '16px', margin: 0, paddingBottom: '16px' }}>My categories</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tasksByCategory.map(cat => (
                    <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{cat.emoji}</span>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#475569', textTransform: 'capitalize' }}>{cat.name}</span>
                      </div>
                      <span style={{ fontSize: '12px', backgroundColor: '#e2e8f0', color: '#475569', padding: '4px 8px', borderRadius: '4px' }}>{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Tracking */}
              <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '16px', margin: 0, paddingBottom: '16px' }}>My tracking</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                  {tasks.filter(t => !t.completed).map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#4f46e5" />
                        <span style={{ fontSize: '14px', color: '#475569', textOverflow: 'ellipsis', overflow: 'hidden' }}>{task.text}</span>
                      </div>
                      <input type="text" placeholder="time" value={timeTracking[task.id] || ''} onChange={(e) => setTimeTracking({...timeTracking, [task.id]: e.target.value})} style={{ width: '64px', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #e2e8f0', outline: 'none' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed)', color: '#fff', padding: '24px', borderRadius: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', opacity: 0.9, margin: '0 0 8px 0' }}>Progress</p>
                  <p style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 8px 0' }}>{completedTasks}/{tasks.length}</p>
                  <p style={{ fontSize: '12px', opacity: 0.75, margin: 0 }}>Tasks completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
