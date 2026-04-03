import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Circle, CheckCircle2, CalendarDays, AlarmClock, LogOut, Loader2, Target, CheckCircle, Sparkles, AlertTriangle, Key, MoreVertical, Edit2, User, Clock, TrendingUp, Flame, Trophy, GripVertical, X, ChevronDown } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// ⚠️ BƯỚC QUAN TRỌNG NHẤT: Thay thông tin từ Firebase Console của bạn vào đây
const firebaseConfig = {
  apiKey: "AIzaSyCpWm7T2pez61uWRpObqjwAmzjbbvzxwLA",
  authDomain: "todo-mini-bk.firebaseapp.com",
  projectId: "todo-mini-bk",
  storageBucket: "todo-mini-bk.firebasestorage.app",
  messagingSenderId: "140758949371",
  appId: "1:140758949371:web:c9652e1d3ce840c5da3f5e",
  measurementId: "G-EP2WE8Q287"
};

// Kiểm tra xem bạn đã thay Key chưa
const isConfigValid = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey.trim() !== "";

let app, auth, db, googleProvider;
if (isConfigValid) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDeadline, setNewDeadline] = useState('');
  const [newCategory, setNewCategory] = useState('work');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedTask, setExpandedTask] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [taskNotes, setTaskNotes] = useState({});
  const [subtasks, setSubtasks] = useState({});
  const [assignedTo, setAssignedTo] = useState({});
  const [timeSpent, setTimeSpent] = useState({});
  const [recurring, setRecurring] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [newRecurring, setNewRecurring] = useState('none');
  const [newTimeEstimate, setNewTimeEstimate] = useState('');

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
      // Initialize recurring state from tasks
      const recurringMap = {};
      taskList.forEach(task => {
        if (task.recurring && task.recurring !== 'none') {
          recurringMap[task.id] = task.recurring;
        }
      });
      setRecurring(recurringMap);
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
      priority: newPriority, 
      deadline: newDeadline || null, 
      category: newCategory, 
      recurring: newRecurring,
      timeEstimate: newTimeEstimate || null,
      createdAt: Date.now() 
    };
    await setDoc(doc(db, 'users', user.uid, 'tasks', taskId), taskData);
    setNewTask('');
    setNewDeadline('');
    setNewRecurring('none');
    setNewTimeEstimate('');
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

  // --- GIAO DIỆN KHI CHƯA CÀI ĐẶT KEY ---
  if (!isConfigValid) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full bg-white/70 p-8 md:p-12 rounded-xl shadow-lg text-center border border-rose-100">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6"><Key size={40} /></div>
          <h1 className="text-2xl font-black text-slate-900 mb-4 tracking-tight uppercase">Lỗi API Key</h1>
          <div className="bg-rose-50/50 p-6 rounded-2xl text-left mb-6 border border-rose-100 space-y-3">
            <p className="text-slate-600 text-xs leading-relaxed">Khoa ơi, bạn chưa thay <strong>Firebase Config</strong> thực vào code rồi!</p>
            <p className="text-slate-600 text-[11px]">Vào <strong>Firebase Console &gt; Project Settings</strong>, copy cái đoạn mã dài dài và dán vào biến <code>firebaseConfig</code> ở đầu file này nhé.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-indigo-600 mb-4" size={40} /><p className="text-slate-400 font-black text-[10px] tracking-widest uppercase text-center">Đang kết nối Cloud...</p></div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-indigo-600 via-purple-900 to-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
        {/* Background Decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 w-full">
          {/* Card */}
          <div className="bg-white/10 backdrop-blur-md p-12 rounded-3xl border border-white/20 text-center shadow-2xl">
            {/* Icon Container */}
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/50">
                <Target size={48} strokeWidth={2} />
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Kế hoạch BK</h1>
            <p className="text-indigo-100 text-base mb-10 font-medium">Đồng bộ vĩnh viễn trên mọi thiết bị.</p>
            
            {/* Button Container with Background */}
            <div className="bg-gradient-to-r from-indigo-400/20 to-purple-400/20 p-6 rounded-2xl mb-8 border border-indigo-300/30 backdrop-blur">
              <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/50 hover:shadow-xl hover:shadow-indigo-500/70 text-base">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                </svg>
                Vào bằng Google
              </button>
            </div>
            
            {/* Security Info */}
            <div className="space-y-2 border-t border-white/10 pt-6">
              <p className="text-indigo-200 text-xs font-semibold">🔒 Bảo mật với Firebase + Google</p>
              <p className="text-indigo-300 text-xs">Dữ liệu của bạn được bảo vệ toàn bộ</p>
            </div>
          </div>
          
          {/* Footer removed */}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col selection:bg-indigo-100 font-sans overflow-hidden">
      {/* Fixed logout button in top-right */}
      <button onClick={handleLogout} aria-label="Đăng xuất" className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/95 text-slate-900 py-2 px-3 rounded-full shadow-2xl border border-slate-200 hover:scale-105 transition-transform">
        <LogOut size={18} />
        <span className="hidden sm:inline font-semibold">Đăng xuất</span>
      </button>
      <div className="w-full h-full flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-4 flex items-center border-b border-slate-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400"></div>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Việc của Khoa 👋</h2>
          </div>
        </div>

        {/* Input Section */}
        <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex-shrink-0">
          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="w-full p-4 space-y-3 bg-transparent">
            {/* Task Input */}
            <div className="relative">
              <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="What's your next task?" className="w-full pl-4 pr-12 py-3 rounded-lg border-none bg-slate-50 text-slate-800 font-bold text-sm shadow-inner outline-none ring-2 ring-transparent focus:ring-indigo-500/10 transition-all" />
              <button type="submit" disabled={!newTask.trim()} className="absolute right-2 top-2 w-9 h-9 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-300 flex items-center justify-center disabled:bg-slate-300 transition-all active:scale-90 hover:scale-105"><Plus size={20} strokeWidth={3} /></button>
            </div>
            
            {/* Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Category Box */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 rounded-lg border border-indigo-200 shadow-sm">
                <label className="text-xs font-black text-indigo-700 uppercase mb-1 block">📁 Category</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full p-2 rounded-md bg-white border border-indigo-300 text-xs font-bold text-indigo-700 outline-none cursor-pointer hover:bg-indigo-50 transition-colors">
                  <option value="work">💼 Work</option>
                  <option value="personal">🎯 Personal</option>
                </select>
              </div>
              
              {/* Priority Box */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200 shadow-sm">
                <label className="text-xs font-black text-amber-700 uppercase mb-1 block">🔥 Priority</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="w-full p-2 rounded-md bg-white border border-amber-300 text-xs font-bold text-amber-700 outline-none cursor-pointer hover:bg-amber-50 transition-colors">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              {/* Deadline Box */}
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-3 rounded-lg border border-rose-200 shadow-sm">
                <label className="text-xs font-black text-rose-700 uppercase mb-1 block">📅 Deadline</label>
                <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="w-full p-2 rounded-md bg-white border border-rose-300 text-xs font-bold text-rose-700 outline-none cursor-pointer hover:bg-rose-50 transition-colors" />
              </div>
            </div>
          </form>
        </div>

        {/* Task List */}
        <div className="px-8 pb-6 space-y-2 flex-1 overflow-y-auto pt-3">
          {tasks.length === 0 ? null : (
            <div className="grid grid-cols-1 gap-2">
              {tasks.length === 0 ? (
                <div className="py-6 text-center opacity-40">
                  <p className="text-xs font-semibold">No tasks found</p>
                </div>
              ) : (
                tasks.map((task, idx) => (
                    <div key={task.id} draggable onDragStart={() => setDraggedTask(task.id)} style={{ animation: `slideIn 0.3s ease-out ${idx * 0.05}s both` }} className={`group p-3 border-b flex items-start gap-3 transition-all duration-300 hover:bg-slate-50 text-sm ${task.completed ? 'opacity-50' : ''}`}>
                      <div className="flex-shrink-0 pt-0.5"><GripVertical size={16} className="text-slate-300" /></div>
                      <button onClick={() => handleToggleTask(task.id)} className={`flex-shrink-0 transition-all transform active:scale-75 ${task.completed ? 'text-indigo-500' : 'text-slate-300 hover:text-indigo-400'}`}>{task.completed ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Circle size={24} strokeWidth={2} />}</button>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`font-bold leading-snug transition-all truncate ${task.completed ? 'text-slate-300 line-through' : 'text-slate-900'}`}>
                            <span className="inline-block px-3 py-1 bg-slate-100 rounded-md">{task.text}</span>
                          </p>
                          <span className={`flex-shrink-0 text-sm font-semibold px-3 py-1 rounded-md ${task.priority === 'high' ? 'bg-rose-100 text-rose-700' : task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{task.priority === 'high' ? 'HIGH' : task.priority === 'medium' ? 'MED' : 'LOW'}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold">{task.category === 'work' ? '💼 Work' : task.category === 'personal' ? '🎯 Personal' : task.category === 'health' ? '💪 Health' : '🛛'}</span>
                          {task.deadline && <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-600">📅 {new Date(task.deadline).toLocaleDateString('vi-VN')}</span>}
                          {recurring[task.id] && <span className="px-3 py-1 rounded-md bg-purple-50 text-purple-600 font-semibold">🔄 {recurring[task.id]}</span>}
                          {timeSpent[task.id] && <span className="px-3 py-1 rounded-md bg-blue-50 text-blue-600 font-semibold">⏱️ {timeSpent[task.id]}h</span>}
                        </div>

                        {/* Expanded Details */}
                        {expandedTask === task.id && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-fade-in">
                            <div>
                              <label className="text-xs font-bold text-slate-600">📝 Notes</label>
                              <input type="text" value={taskNotes[task.id] || ''} onChange={(e) => setTaskNotes({...taskNotes, [task.id]: e.target.value})} placeholder="Add notes..." className="w-full mt-0.5 p-1.5 rounded bg-slate-50 border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-300" />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600">✓ Subtasks</label>
                              <div className="space-y-0.5 mt-0.5">
                                {(subtasks[task.id] || []).map((st, i) => (
                                  <div key={i} className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded">
                                    <input type="checkbox" defaultChecked className="w-3 h-3" />
                                    <span className="text-xs flex-1">{st}</span>
                                    <button onClick={() => setSubtasks({...subtasks, [task.id]: subtasks[task.id].filter((_, idx) => idx !== i)})} className="text-slate-300 hover:text-rose-500"><X size={12} /></button>
                                  </div>
                                ))}
                                <input type="text" placeholder="Add subtask..." onKeyPress={(e) => {
                                  if (e.key === 'Enter' && e.target.value.trim()) {
                                    setSubtasks({...subtasks, [task.id]: [...(subtasks[task.id] || []), e.target.value]});
                                    e.target.value = '';
                                  }
                                }} className="w-full p-1.5 rounded bg-white border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-300" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="text-xs font-bold text-slate-600">⏱️ Hours</label>
                                <input type="number" value={timeSpent[task.id] || ''} onChange={(e) => setTimeSpent({...timeSpent, [task.id]: e.target.value})} placeholder="0" className="w-full mt-0.5 p-1.5 rounded bg-slate-50 border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-300" />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-600">👤 Assigned</label>
                                <input type="text" value={assignedTo[task.id] || ''} onChange={(e) => setAssignedTo({...assignedTo, [task.id]: e.target.value})} placeholder="Name" className="w-full mt-0.5 p-1.5 rounded bg-slate-50 border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-300" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-slate-200 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 hover:scale-110"><Trash2 size={18} strokeWidth={2} /></button>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        <div className="px-8 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center gap-2 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400"></div>
        </div>
      </div>
    </div>
  );
}