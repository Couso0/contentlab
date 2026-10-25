import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, LayoutGrid, Calendar as CalendarIcon, Video, Link as LinkIcon, 
  Trash2, Edit3, ExternalLink, Moon, Sun, Search, X, Upload, 
  Play, Sparkles, User, Users, FolderKanban, Clock, PlusCircle,
  Lock, LogOut, ShieldCheck, Eye, UserPlus, UserCheck, Key,
  AlertTriangle, Globe, Image as ImageIcon, CheckCircle, RefreshCw,
  ChevronLeft, ChevronRight, Download
} from 'lucide-react';

// Inicializar cliente de Supabase (Usando la llave anon / legacy)
const SUPABASE_URL = 'https://eeksouotnjqhfxywfuvh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVla3NvdW90bmpxaGZ4eXdmdXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3Mzk1NTUsImV4cCI6MjA0NTMxNTU1NX0.eyJzZWNyZXRfa2V5IjoidlF2QXAzc0Fsc1FwUW5RMjAzUGxRdyJ9'; // Reemplazado con tu llave anon oficial

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// --- USUARIOS INICIALES DE ACCESO ---
const SEED_USERS = [
  {
    id: 'u_admin',
    username: 'Mariapcmg',
    password: 'Miranda09*',
    role: 'Admin',
    name: 'María (Administradora)'
  },
  {
    id: 'u_lector',
    username: 'Lector',
    password: 'Lector1234',
    role: 'Lector',
    name: 'Usuario Lectura'
  }
];

const PLATFORM_OPTIONS = ['TikTok', 'Instagram', 'YouTube Shorts', 'Facebook Reels'];

export default function App() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Core App States
  const [users, setUsers] = useState([]);
  const [models, setModels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // UI States
  const [darkMode, setDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState('models'); // 'models' | 'calendar' | 'users'
  const [selectedModelFilter, setSelectedModelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calendar Navigation State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Toast Feedback State
  const [toast, setToast] = useState(null);

  // Modals
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form States
  const [editingItem, setEditingItem] = useState(null);
  const [editingModel, setEditingModel] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [videoFormData, setVideoFormData] = useState({
    modelId: '',
    title: '',
    referenceLink: '',
    mediaUrl: '',
    notes: '',
    status: 'Inspiration',
    targetDate: new Date().toISOString().split('T')[0],
    platforms: ['Instagram', 'TikTok']
  });

  const [modelFormData, setModelFormData] = useState({
    name: '',
    handle: '',
    color: '#6366f1',
    avatarUrl: '',
    socialLink: '',
    notes: ''
  });

  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Lector'
  });

  // --- CARGAR DATOS DESDE SUPABASE CON DEPURACIÓN ---
  useEffect(() => {
    fetchCloudData();
  }, []);

  const fetchCloudData = async () => {
    if (!supabase) {
      setIsDataLoaded(true);
      return;
    }

    try {
      // 1. Cargar Usuarios
      const { data: dbUsers } = await supabase.from('app_users').select('*');
      if (dbUsers && dbUsers.length > 0) {
        setUsers(dbUsers);
      } else {
        setUsers(SEED_USERS);
      }

      // 2. Cargar Modelos
      const { data: dbModels } = await supabase.from('models').select('*');
      if (dbModels) {
        const normalizedModels = dbModels.map((m) => ({
          ...m,
          id: String(m.id),
          name: m.name || 'Sin Nombre',
          avatarUrl: m.avatarUrl || m.avatar_url || '',
          socialLink: m.socialLink || m.social_link || ''
        }));
        setModels(normalizedModels);
      }

      // 3. Cargar Vídeos (Con manejo robusto de errores y registros)
      const { data: dbVideos, error: videosErr } = await supabase.from('videos').select('*');
      if (videosErr) {
        console.error('Error al cargar vídeos de Supabase:', videosErr);
      }
      
      if (dbVideos) {
        const normalizedVideos = dbVideos.map((item) => ({
          ...item,
          id: String(item.id),
          modelId: String(item.modelId || item.model_id || ''),
          targetDate: item.targetDate || item.target_date || new Date().toISOString().split('T')[0],
          referenceLink: item.referenceLink || item.reference_link || '',
          mediaUrl: item.mediaUrl || item.media_url || ''
        }));
        
        const uniqueVideos = Array.from(new Map(normalizedVideos.map(item => [item.id, item])).values());
        setVideos(uniqueVideos);
      }

      // Cargar sesión
      const savedUser = localStorage.getItem('cps_current_user_v2');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedTheme = localStorage.getItem('cps_theme_v2');
      if (savedTheme !== null) setDarkMode(JSON.parse(savedTheme));

    } catch (e) {
      console.error('Excepción al conectar con Supabase:', e);
    } finally {
      setIsDataLoaded(true);
    }
  };

  // Theme Toggler
  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem('cps_theme_v2', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode, isDataLoaded]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // --- AUTHENTICATION ---
  const handleLogin = (e) => {
    e.preventDefault();
    const usernameInput = userFormData.username.trim().toLowerCase();
    const passwordInput = userFormData.password;

    const matched = users.find(
      (u) => u.username.toLowerCase() === usernameInput && u.password === passwordInput
    );

    if (matched) {
      setCurrentUser(matched);
      localStorage.setItem('cps_current_user_v2', JSON.stringify(matched));
      setUserFormData({ name: '', username: '', password: '', role: 'Lector' });
      showToast(`¡Bienvenido/a, ${matched.name || matched.username}!`);
    } else {
      showToast('Credenciales incorrectas.', 'danger');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cps_current_user_v2');
    setViewMode('models');
    showToast('Sesión cerrada');
  };

  const isAdmin = currentUser?.role === 'Admin';

  const togglePlatform = (platform) => {
    if (!isAdmin) return;
    setVideoFormData((prev) => {
      const exists = prev.platforms?.includes(platform);
      if (exists) {
        return { ...prev, platforms: prev.platforms.filter((p) => p !== platform) };
      } else {
        return { ...prev, platforms: [...(prev.platforms || []), platform] };
      }
    });
  };

  const handleVideoFileUpload = (e) => {
    if (!isAdmin) return;
    const file = e.target.files[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        showToast('El archivo supera los 30MB recomendados.', 'danger');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoFormData((prev) => ({ ...prev, mediaUrl: reader.result }));
        showToast('Borrador cargado con éxito');
      };
      reader.readAsDataURL(file);
    }
  };

  // --- CRUD: VIDEOS ---
  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !videoFormData.title.trim()) return;

    const uniqueId = editingItem 
      ? editingItem.id 
      : 'vid_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6);

    const videoPayload = {
      id: uniqueId,
      title: videoFormData.title,
      status: videoFormData.status,
      notes: videoFormData.notes,
      platforms: videoFormData.platforms,
      modelId: videoFormData.modelId,
      model_id: videoFormData.modelId,
      targetDate: videoFormData.targetDate,
      target_date: videoFormData.targetDate,
      referenceLink: videoFormData.referenceLink,
      reference_link: videoFormData.referenceLink,
      mediaUrl: videoFormData.mediaUrl,
      media_url: videoFormData.mediaUrl,
      createdAt: editingItem ? (editingItem.createdAt || editingItem.created_at) : new Date().toISOString()
    };

    if (editingItem) {
      if (supabase) {
        await supabase.from('videos').update(videoPayload).eq('id', editingItem.id);
      }
      setVideos((prev) => prev.map((v) => (v.id === editingItem.id ? videoPayload : v)));
      showToast('Vídeo actualizado correctamente');
    } else {
      if (supabase) {
        await supabase.from('videos').insert([videoPayload]);
      }
      setVideos((prev) => [videoPayload, ...prev.filter(v => v.id !== videoPayload.id)]);
      showToast('Nuevo vídeo guardado');
    }

    closeVideoModal();
  };

  const openNewVideoModal = (defaultModelId = null, defaultDate = null) => {
    if (!isAdmin) return;
    setEditingItem(null);
    setVideoFormData({
      modelId: defaultModelId || (selectedModelFilter !== 'all' ? selectedModelFilter : (models[0]?.id || '')),
      title: '',
      referenceLink: '',
      mediaUrl: '',
      notes: '',
      status: 'Inspiration',
      targetDate: defaultDate || new Date().toISOString().split('T')[0],
      platforms: ['TikTok', 'Instagram']
    });
    setIsVideoModalOpen(true);
  };

  const handleEditVideo = (item) => {
    setEditingItem(item);
    setVideoFormData({
      ...item,
      modelId: item.modelId || item.model_id || '',
      targetDate: item.targetDate || item.target_date || new Date().toISOString().split('T')[0],
      referenceLink: item.referenceLink || item.reference_link || '',
      mediaUrl: item.mediaUrl || item.media_url || ''
    });
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setEditingItem(null);
  };

  // --- CRUD: MODELS ---
  const handleModelSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !modelFormData.name.trim()) return;

    const modelId = editingModel ? editingModel.id : 'mod_' + Date.now().toString();
    const modelPayload = {
      id: modelId,
      name: modelFormData.name,
      handle: modelFormData.handle,
      color: modelFormData.color,
      notes: modelFormData.notes,
      avatarUrl: modelFormData.avatarUrl,
      avatar_url: modelFormData.avatarUrl,
      socialLink: modelFormData.socialLink,
      social_link: modelFormData.socialLink
    };

    if (editingModel) {
      if (supabase) {
        await supabase.from('models').update(modelPayload).eq('id', editingModel.id);
      }
      setModels(models.map((m) => (m.id === editingModel.id ? modelPayload : m)));
      showToast('Perfil de modelo actualizado');
    } else {
      if (supabase) {
        await supabase.from('models').insert([modelPayload]);
      }
      setModels([...models, modelPayload]);
      showToast('Modelo creada con éxito');
    }

    closeModelModal();
  };

  const handleEditModel = (model) => {
    if (!isAdmin) return;
    setEditingModel(model);
    setModelFormData({
      ...model,
      avatarUrl: model.avatarUrl || model.avatar_url || '',
      socialLink: model.socialLink || model.social_link || ''
    });
    setIsModelModalOpen(true);
  };

  const closeModelModal = () => {
    setIsModelModalOpen(false);
    setEditingModel(null);
    setModelFormData({ name: '', handle: '', color: '#6366f1', avatarUrl: '', socialLink: '', notes: '' });
  };

  // --- CRUD: USERS ---
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !userFormData.username.trim() || !userFormData.password.trim()) return;

    if (editingUser) {
      const updated = { ...userFormData, id: editingUser.id };
      if (supabase) {
        await supabase.from('app_users').update(updated).eq('id', editingUser.id);
      }
      setUsers(users.map((u) => (u.id === editingUser.id ? updated : u)));
      if (editingUser.id === currentUser.id) {
        setCurrentUser(updated);
        localStorage.setItem('cps_current_user_v2', JSON.stringify(updated));
      }
      showToast('Usuario modificado');
    } else {
      const newUser = {
        ...userFormData,
        id: 'usr_' + Date.now().toString()
      };
      if (supabase) {
        await supabase.from('app_users').insert([newUser]);
      }
      setUsers([...users, newUser]);
      showToast('Nuevo usuario creado');
    }

    closeUserModal();
  };

  const openNewUserModal = () => {
    if (!isAdmin) return;
    setEditingUser(null);
    setUserFormData({ name: '', username: '', password: '', role: 'Lector' });
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    if (!isAdmin) return;
    setEditingUser(user);
    setUserFormData(user);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
    setUserFormData({ name: '', username: '', password: '', role: 'Lector' });
  };

  // --- DELETE EXECUTION ---
  const requestDelete = (type, id, title) => {
    if (!isAdmin) return;
    if (type === 'user' && id === currentUser.id) {
      showToast('No puedes eliminar tu propio usuario activo.', 'danger');
      return;
    }
    setDeleteConfirm({ type, id, title });
  };

  const executeDelete = async () => {
    if (!deleteConfirm || !isAdmin) return;

    const { type, id } = deleteConfirm;

    if (type === 'video') {
      if (supabase) await supabase.from('videos').delete().eq('id', id);
      setVideos(videos.filter((v) => v.id !== id));
      showToast('Vídeo eliminado correctamente');
    } else if (type === 'model') {
      if (supabase) {
        await supabase.from('models').delete().eq('id', id);
        await supabase.from('videos').delete().eq('modelId', id);
        await supabase.from('videos').delete().eq('model_id', id);
      }
      setModels(models.filter((m) => m.id !== id));
      setVideos(videos.filter((v) => (v.modelId || v.model_id) !== id));
      if (selectedModelFilter === id) {
        setSelectedModelFilter('all');
      }
      showToast('Modelo y sus vídeos fueron eliminados');
    } else if (type === 'user') {
      if (supabase) await supabase.from('app_users').delete().eq('id', id);
      setUsers(users.filter((u) => u.id !== id));
      showToast('Usuario eliminado');
    }

    setDeleteConfirm(null);
  };

  // Calculated Filters
  const filteredVideos = useMemo(() => {
    const uniqueMap = new Map();
    videos.forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    return Array.from(uniqueMap.values()).filter((item) => {
      const itemModelId = String(item.modelId || item.model_id || '');
      const matchesModel = selectedModelFilter === 'all' || itemModelId === String(selectedModelFilter);
      const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesModel && matchesSearch;
    });
  }, [videos, selectedModelFilter, searchQuery]);

  const modelMap = useMemo(() => {
    return models.reduce((acc, m) => {
      acc[String(m.id)] = m;
      return acc;
    }, {});
  }, [models]);

  // --- CALENDAR DAYS ---
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      days.push({ dateStr: null, dayNum, isCurrentMonth: false });
    }

    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    const totalCells = Math.ceil(days.length / 7) * 7;
    const nextDaysNeeded = totalCells - days.length;
    for (let nd = 1; nd <= nextDaysNeeded; nd++) {
      days.push({ dateStr: null, dayNum: nd, isCurrentMonth: false });
    }

    return days;
  }, [currentCalendarDate]);

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
        
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold text-white border ${
            toast.type === 'danger' ? 'bg-red-600 border-red-500' : 'bg-emerald-600 border-emerald-500'
          }`}>
            <CheckCircle className="w-4 h-4" /> {toast.message}
          </div>
        )}

        <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 sm:p-8 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Content Studio</h1>
                <p className="text-xs text-slate-400">Planificador Sincronizado</p>
              </div>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold">Iniciar Sesión</h2>
            <p className="text-xs text-slate-400 mt-1">Ingresa con tu cuenta asignada</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">Usuario</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Nombre de usuario"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 to-indigo-600 text-white hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              Entrar al Panel
            </button>
          </form>

        </div>
      </div>
    );
  }

  // --- MAIN APP DASHBOARD ---
  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold text-white border transition-all animate-bounce ${
          toast.type === 'danger' ? 'bg-red-600 border-red-500' : 'bg-emerald-600 border-emerald-500'
        }`}>
          <CheckCircle className="w-4 h-4" /> {toast.message}
        </div>
      )}

      {/* HEADER BAR */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight tracking-wide">Studio Planner</h1>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">● Cloud Synced</span>
            </div>
          </div>

          {/* Model Filter Dropdown */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedModelFilter}
                onChange={(e) => setSelectedModelFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold cursor-pointer pr-1"
              >
                <option value="all" className={darkMode ? 'bg-slate-900' : 'bg-white'}>Todas las Modelos</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id} className={darkMode ? 'bg-slate-900' : 'bg-white'}>
                    {m.name} ({m.handle})
                  </option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setEditingModel(null);
                  setModelFormData({ name: '', handle: '', color: '#6366f1', avatarUrl: '', socialLink: '', notes: '' });
                  setIsModelModalOpen(true);
                }}
                className={`p-2 rounded-xl border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'}`}
                title="Añadir Nueva Modelo"
              >
                <User className="w-4 h-4 text-pink-500" />
              </button>
            )}
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
              <div className="flex flex-col">
                <span className="font-bold">{currentUser.username}</span>
                <span className="text-[10px] text-slate-400">{isAdmin ? 'Administrador' : 'Lector'}</span>
              </div>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAdmin && (
              <button
                onClick={() => openNewVideoModal()}
                className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Vídeo</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className={`p-2 rounded-xl border text-red-400 hover:bg-red-500/10 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* READ ONLY BANNER */}
      {!isAdmin && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-medium text-amber-500 flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" /> Modo de Solo Lectura: Haz clic en cualquier vídeo para reproducirlo o ver sus detalles.
        </div>
      )}

      {/* NAVIGATION BAR */}
      <div className={`border-b ${darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-100/50'} py-3 px-4 sm:px-8`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className={`flex p-1 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button
              onClick={() => setViewMode('models')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'models' ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <FolderKanban className="w-3.5 h-3.5" /> Secciones por Modelo
            </button>
            
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendario
            </button>

            {isAdmin && (
              <button
                onClick={() => setViewMode('users')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'users' ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Users className="w-3.5 h-3.5" /> Gestión de Usuarios
              </button>
            )}
          </div>

          {viewMode !== 'users' && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs w-full md:w-64 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar vídeos o notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full"
              />
            </div>
          )}

        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: SECTIONS BY MODEL */}
        {viewMode === 'models' && (
          <div className="space-y-8">
            {models.length === 0 && (
              <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <User className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                <h3 className="font-bold text-base mb-1">Aún no hay modelos registradas</h3>
                <p className="text-xs text-slate-400 mb-4">Empieza agregando la primera modelo para gestionar su contenido.</p>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingModel(null);
                      setModelFormData({ name: '', handle: '', color: '#6366f1', avatarUrl: '', socialLink: '', notes: '' });
                      setIsModelModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white"
                  >
                    + Añadir Modelo
                  </button>
                )}
              </div>
            )}

            {(selectedModelFilter === 'all' 
              ? models 
              : models.filter((m) => String(m.id) === String(selectedModelFilter))
            ).map((model) => {
              const modelVideos = filteredVideos.filter((item) => String(item.modelId || item.model_id) === String(model.id));

              return (
                <div key={model.id} className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                  
                  {/* Model Header */}
                  <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      {model.avatarUrl ? (
                        <img 
                          src={model.avatarUrl} 
                          alt={model.name} 
                          className="w-11 h-11 rounded-full object-cover border-2 shadow"
                          style={{ borderColor: model.color || '#6366f1' }}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base shadow" style={{ backgroundColor: model.color || '#6366f1' }}>
                          {model.name.charAt(0)}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base">{model.name}</h3>
                          <span className="text-xs text-slate-400">{model.handle}</span>

                          {model.socialLink && (
                            <a
                              href={model.socialLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                              title="Ver Red Social"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {model.notes && <p className="text-xs text-slate-500">{model.notes}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openNewVideoModal(model.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Añadir vídeo
                          </button>

                          <button
                            onClick={() => handleEditModel(model)}
                            className="p-1.5 text-slate-400 hover:text-slate-200"
                            title="Editar Modelo"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => requestDelete('model', model.id, model.name)}
                            className="p-1.5 text-slate-400 hover:text-red-400"
                            title="Eliminar Modelo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Video Grid */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modelVideos.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleEditVideo(item)}
                        className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between gap-4 shadow-sm cursor-pointer hover:border-indigo-500/50 transition-colors`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {item.status}
                            </span>
                            <span className="text-xs text-slate-400">{item.targetDate || item.target_date}</span>
                          </div>
                          <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                          {item.notes && <p className="text-xs text-slate-400 line-clamp-2">{item.notes}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                          <div className="flex flex-wrap gap-1">
                            {item.platforms?.map((p, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{p}</span>
                            ))}
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleEditVideo(item)} className="p-1 text-slate-400 hover:text-slate-200" title="Editar">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => requestDelete('video', item.id, item.title)} className="p-1 text-slate-400 hover:text-red-400" title="Eliminar">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {modelVideos.length === 0 && (
                      <div className="col-span-full py-8 text-center text-xs text-slate-500">
                        No hay vídeos registrados para esta modelo.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: REAL CALENDAR GRID */}
        {viewMode === 'calendar' && (
          <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
            
            {/* Calendar Header Control */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold capitalize">
                  {currentCalendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const prev = new Date(currentCalendarDate);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentCalendarDate(prev);
                  }}
                  className={`p-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-950 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentCalendarDate(new Date())}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-950 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}
                >
                  Hoy
                </button>

                <button
                  onClick={() => {
                    const next = new Date(currentCalendarDate);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentCalendarDate(next);
                  }}
                  className={`p-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-950 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider mb-2 text-slate-400">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mié</div>
              <div>Jue</div>
              <div>Vie</div>
              <div>Sáb</div>
              <div>Dom</div>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((day, idx) => {
                const dayVideos = day.dateStr ? filteredVideos.filter((v) => (v.targetDate || v.target_date) === day.dateStr) : [];
                const isToday = day.dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={idx}
                    className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                      day.isCurrentMonth
                        ? darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                        : darkMode ? 'bg-slate-950/40 border-slate-900 opacity-40' : 'bg-slate-100/40 border-slate-100 opacity-40'
                    } ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold ${isToday ? 'text-indigo-400' : day.isCurrentMonth ? 'text-slate-200' : 'text-slate-500'}`}>
                        {day.dayNum}
                      </span>
                      {isAdmin && day.isCurrentMonth && (
                        <button
                          onClick={() => openNewVideoModal(null, day.dateStr)}
                          className="text-slate-500 hover:text-indigo-400 p-0.5"
                          title="Agendar vídeo este día"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[70px]">
                      {dayVideos.map((video) => {
                        const m = modelMap[String(video.modelId || video.model_id)];
                        return (
                          <div
                            key={video.id}
                            onClick={() => handleEditVideo(video)}
                            className="p-1 rounded text-[10px] cursor-pointer hover:opacity-80 transition-opacity flex flex-col gap-0.5 border"
                            style={{
                              backgroundColor: `${m?.color || '#6366f1'}20`,
                              borderColor: `${m?.color || '#6366f1'}50`,
                              color: darkMode ? '#ffffff' : '#000000'
                            }}
                            title={`${video.title} - ${m?.name || 'Modelo'}`}
                          >
                            <span className="font-bold line-clamp-1">{video.title}</span>
                            <span className="text-[9px] opacity-75">{m?.name ? m.name.split(' ')[0] : 'Vídeo'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* VIEW 3: USERS MANAGEMENT */}
        {viewMode === 'users' && isAdmin && (
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> Gestión de Usuarios del Estudio
              </h2>
              <button
                onClick={openNewUserModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
              >
                <UserPlus className="w-3.5 h-3.5" /> Nuevo Usuario
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map((u) => (
                <div key={u.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      {u.name || u.username}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === 'Admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        {u.role}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Usuario: <code className="text-indigo-400">{u.username}</code></p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditUser(u)} className="p-1.5 text-slate-400 hover:text-white" title="Editar">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {u.id !== currentUser.id && (
                      <button onClick={() => requestDelete('user', u.id, u.username)} className="p-1.5 text-slate-400 hover:text-red-400" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL COMPLETO: NUEVO / EDITAR / VER VÍDEO */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border bg-slate-900 border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2 text-pink-500 font-bold text-lg">
                <Sparkles className="w-5 h-5" />
                <h3>
                  {!isAdmin 
                    ? 'Detalles del Vídeo' 
                    : editingItem 
                      ? 'Editar Vídeo Planeado' 
                      : 'Nuevo Vídeo Planeado'}
                </h3>
              </div>
              <button onClick={closeVideoModal} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={isAdmin ? handleVideoSubmit : (e) => { e.preventDefault(); closeVideoModal(); }} className="space-y-4">
              
              {/* Modelo / Creadora */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Modelo / Creadora *</label>
                <select
                  disabled={!isAdmin}
                  value={videoFormData.modelId}
                  onChange={(e) => setVideoFormData({ ...videoFormData, modelId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white font-medium disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccionar Modelo...</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.handle})</option>
                  ))}
                </select>
              </div>

              {/* Título / Concepto */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Título / Concepto del vídeo *</label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  placeholder="Ej: Transición con ropa de verano"
                  value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white disabled:opacity-80 disabled:cursor-not-allowed"
                />
              </div>

              {/* Link de referencia / Inspo */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Link de referencia / Inspo</label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="url"
                    disabled={!isAdmin}
                    placeholder="https://tiktok.com/... o instagram.com/reel/..."
                    value={videoFormData.referenceLink || ''}
                    onChange={(e) => setVideoFormData({ ...videoFormData, referenceLink: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white disabled:opacity-80 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* REPRODUCTOR Y SUBIDA DE BORRADOR */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Borrador o Muestra</label>
                
                {videoFormData.mediaUrl && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 space-y-2">
                    <video 
                      src={videoFormData.mediaUrl} 
                      controls 
                      className="w-full max-h-56 rounded-lg bg-black object-contain"
                    />
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1">
                        <Play className="w-3.5 h-3.5" /> Vista Previa
                      </span>
                      <a
                        href={videoFormData.mediaUrl}
                        download={`borrador_${videoFormData.title || 'video'}.mp4`}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar
                      </a>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <label className="border border-dashed border-slate-800 hover:border-indigo-500 bg-slate-950 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs text-slate-400 font-medium">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>{videoFormData.mediaUrl ? 'Reemplazar borrador de vídeo' : 'Adjuntar borrador de vídeo'}</span>
                    <input type="file" accept="video/*" onChange={handleVideoFileUpload} className="hidden" />
                  </label>
                )}

                {!isAdmin && !videoFormData.mediaUrl && (
                  <div className="border border-slate-800 bg-slate-950 rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-slate-500">
                    Sin borrador adjunto para este vídeo
                  </div>
                )}
              </div>

              {/* Estado y Fecha Planificada */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Estado</label>
                  <select
                    disabled={!isAdmin}
                    value={videoFormData.status}
                    onChange={(e) => setVideoFormData({ ...videoFormData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white disabled:opacity-80 disabled:cursor-not-allowed"
                  >
                    <option value="Inspiration">💡 Idea / Inspo</option>
                    <option value="En Producción">🎬 En Producción</option>
                    <option value="Listo para subir">✅ Listo para subir</option>
                    <option value="Publicado">🚀 Publicado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Fecha Planificada</label>
                  <input
                    type="date"
                    disabled={!isAdmin}
                    value={videoFormData.targetDate}
                    onChange={(e) => setVideoFormData({ ...videoFormData, targetDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white disabled:opacity-80 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Plataformas */}
              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-300">Plataformas</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map((platform) => {
                    const isSelected = videoFormData.platforms?.includes(platform);
                    return (
                      <button
                        type="button"
                        key={platform}
                        onClick={() => isAdmin && togglePlatform(platform)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        } ${!isAdmin ? 'cursor-default opacity-90' : 'hover:text-white'}`}
                      >
                        {platform}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notas / Idea de Ejecución */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Notas / Idea de Ejecución</label>
                <textarea
                  rows="3"
                  disabled={!isAdmin}
                  placeholder="Escribe notas o el guión aquí..."
                  value={videoFormData.notes}
                  onChange={(e) => setVideoFormData({ ...videoFormData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white resize-none disabled:opacity-80 disabled:cursor-not-allowed"
                />
              </div>

              {/* Acciones */}
              <div className="flex justify-end items-center gap-3 pt-4">
                {isAdmin ? (
                  <>
                    <button type="button" onClick={closeVideoModal} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium">Cancelar</button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-90 text-white font-bold text-sm shadow-lg shadow-indigo-500/25">
                      {editingItem ? 'Guardar Cambios' : 'Crear Vídeo'}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={closeVideoModal} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg">
                    Cerrar
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: MODELO */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-slate-900 border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingModel ? 'Editar Modelo' : 'Nueva Modelo'}</h3>
              <button onClick={closeModelModal} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleModelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Elena"
                  value={modelFormData.name}
                  onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Handle / Red Social</label>
                <input
                  type="text"
                  placeholder="Ej: @elena_official"
                  value={modelFormData.handle}
                  onChange={(e) => setModelFormData({ ...modelFormData, handle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Notas / Descripción</label>
                <input
                  type="text"
                  placeholder="Ej: Contenido de moda"
                  value={modelFormData.notes}
                  onChange={(e) => setModelFormData({ ...modelFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={closeModelModal} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm">Guardar Modelo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: USUARIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-slate-900 border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={closeUserModal} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Nombre de Usuario</label>
                <input
                  type="text"
                  required
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Contraseña</label>
                <input
                  type="text"
                  required
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Rol</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                >
                  <option value="Admin">Admin (Control total)</option>
                  <option value="Lector">Lector (Solo ver)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={closeUserModal} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm">Guardar Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ELIMINAR */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border bg-slate-900 border-slate-800 p-6 text-center shadow-2xl text-slate-100">
            <h3 className="text-base font-bold mb-2">¿Estás segura?</h3>
            <p className="text-xs text-slate-400 mb-6">Vas a eliminar <strong className="text-white">"{deleteConfirm.title}"</strong> permanentemente.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs">Cancelar</button>
              <button onClick={executeDelete} className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-xs">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
