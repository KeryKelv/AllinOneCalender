import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Circle, CheckCircle2, LogOut, Loader2, Target, Search, Calendar, Clock, Settings, Bell, Home } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

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
  const days = [];
  
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth(currentMonth); i++) days.push(i);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <div className="flex gap-2">
          <button onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1 hover:bg-slate-100 rounded">←</button>
          <button onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1 hover:bg-slate-100 rounded">→</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-600 mb-2">
        <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <button key={idx} onClick={() => day && onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))} 
            className={`p-2 rounded text-sm font-bold transition ${day === selectedDate?.getDate() && currentMonth.getMonth() === selectedDate?.getMonth() ? 'bg-amber-300 text-slate-900' : day ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-200'}`}>
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeTracking, setTimeTracking] = useState({});
  const [activeSection, setActiveSection] = useState('dashboard');

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
    if (!newTask.trim() || !user || !isConfigValid) return;
    const taskId = Date.now().toString();
    const taskData = { 
      text: newTask.trim(), 
      completed: false, 
      category: newCategory,
      dueDate: selectedDate.toISOString().split('T')[0],
      createdAt: Date.now() 
    };
    await setDoc(doc(db, 'users', user.uid, 'tasks', taskId), taskData);
    setNewTask('');
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
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full bg-white/70 p-8 md:p-12 rounded-xl shadow-lg text-center border border-rose-100">
          <h1 className="text-2xl font-black text-slate-900 mb-4">Lỗi API Key</h1>
          <p className="text-slate-600 text-sm">Vui lòng thay Firebase Config trong file App.jsx</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-indigo-600 mb-4" size={40} /></div>;
  }

  if (!user) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-indigo-600 via-purple-900 to-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 w-full">
          <div className="bg-white/10 backdrop-blur-md p-12 rounded-3xl border border-white/20 text-center shadow-2xl max-w-lg mx-auto">
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/50">
                <Target size={48} strokeWidth={2} />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Kế hoạch BK</h1>
            <p className="text-indigo-100 text-base mb-10 font-medium">Quản lý công việc giống Organizo</p>
            <div className="bg-gradient-to-r from-indigo-400/20 to-purple-400/20 p-6 rounded-2xl mb-8 border border-indigo-300/30 backdrop-blur">
              <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/50 hover:shadow-xl hover:shadow-indigo-500/70 text-base">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
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

  const categoryEmojis = { work: '💼', personal: '🎯', family: '👨‍👩‍👧', freelance: '💻' };
  const categories = ['work', 'personal', 'family', 'freelance'];
  const tasksByCategory = categories.map(cat => ({ name: cat, emoji: categoryEmojis[cat], count: tasks.filter(t => t.category === cat).length }));
  const completedTasks = tasks.filter(t => t.completed).length;
  const todayTasks = tasks.filter(t => !t.completed && t.dueDate === selectedDate.toISOString().split('T')[0]);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 flex font-sans overflow-hidden">
      {/* ===== SIDEBAR ===== */}
      <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-lg overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-black flex items-center gap-2"><span className="text-yellow-400">🎯</span> Organizo</h1>
          <p className="text-xs text-slate-400 mt-1">{user?.displayName || user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'my-tasks', label: 'My tasks', icon: Circle },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeSection === item.id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-700'}`}>
                <Icon size={20} /> {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 transition">
            <LogOut size={20} /> Log out
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-3 text-slate-400" />
              <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 rounded-lg bg-slate-100 border border-slate-300 focus:border-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-auto p-8" style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
            {/* Left Column: Calendar - 1/4 */}
            <div style={{ flex: '0 0 25%', minWidth: 0 }}>
              <SimpleCalendar currentMonth={currentMonth} selectedDate={selectedDate} onDateSelect={setSelectedDate} onMonthChange={setCurrentMonth} />
            </div>

            {/* Middle Columns: Tasks - 1/2 */}
            <div style={{ flex: '0 0 50%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* My Tasks */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">My tasks ({tasks.filter(t => !t.completed).length})</h3>
                  <button className="text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1 rounded">+ New task</button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {todayTasks.length > 0 ? todayTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition">
                      <button onClick={() => handleToggleTask(task.id)} className="flex-shrink-0">
                        {task.completed ? <CheckCircle2 size={20} className="text-indigo-500" /> : <Circle size={20} className="text-slate-400" />}
                      </button>
                      <div className="flex-1">
                        <p className={task.completed ? 'line-through text-slate-400' : 'text-slate-900 font-medium'}>{task.text}</p>
                        <p className="text-xs text-slate-500">{task.category}</p>
                      </div>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 text-center py-4">No tasks for today</p>
                  )}
                </div>
              </div>

              {/* Add Task Form */}
              <form onSubmit={handleAddTask} className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200">
                <h4 className="font-bold text-slate-900 mb-4">Add New Task</h4>
                <div className="space-y-3">
                  <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="What's your next task?" className="w-full px-4 py-3 rounded-lg border border-indigo-300 bg-white focus:border-indigo-500 outline-none" />
                  <div className="flex gap-3">
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 px-4 py-2 rounded-lg border border-indigo-300 bg-white text-sm">
                      {categories.map(cat => <option key={cat} value={cat}>{categoryEmojis[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                    </select>
                    <button type="submit" disabled={!newTask.trim()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-bold transition">
                      <Plus size={20} /> Add
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Categories & Tracking - 1/4 */}
            <div style={{ flex: '0 0 25%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* My Categories */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">My categories</h3>
                <div className="space-y-3">
                  {tasksByCategory.map(cat => (
                    <div key={cat.name} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-sm font-medium text-slate-700 capitalize">{cat.name}</span>
                      </div>
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Tracking */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">My tracking</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {tasks.filter(t => !t.completed).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-indigo-500" />
                        <span className="text-sm text-slate-700 truncate">{task.text}</span>
                      </div>
                      <input type="text" placeholder="time" value={timeTracking[task.id] || ''} onChange={(e) => setTimeTracking({...timeTracking, [task.id]: e.target.value})} className="w-16 px-2 py-1 rounded text-xs border border-slate-200 focus:border-indigo-500 outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-2xl">
                <div className="text-center">
                  <p className="text-sm opacity-90">Progress</p>
                  <p className="text-3xl font-black">{completedTasks}/{tasks.length}</p>
                  <p className="text-xs opacity-75 mt-2">Tasks completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
