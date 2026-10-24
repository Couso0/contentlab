import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, LayoutGrid, Calendar as CalendarIcon, Video, Link as LinkIcon, 
  Trash2, Edit3, ExternalLink, Moon, Sun, Search, X, Upload, 
  Play, Sparkles, User, Users, FolderKanban, Clock, PlusCircle,
  Lock, LogOut, ShieldCheck, Eye, UserPlus, UserCheck, Key,
  AlertTriangle, Globe, Image as ImageIcon, CheckCircle, RefreshCw
} from 'lucide-react';


// Inicializar cliente de Supabase
const SUPABASE_URL = 'https://eeksouotnjqhfxywfuvh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yn1K0PuqxX6fZehRQBmqAw_wArBvDf_';

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
// --- INITIAL SEED USERS ---
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

// --- INITIAL SEED MODELS ---
const SEED_MODELS = [
  {
    id: 'm1',
    name: 'Modelo A (Elena)',
    handle: '@elena_official',
    color: '#ec4899',
    avatarUrl: '',
    socialLink: 'https://instagram.com',
    notes: 'Enfoque en moda, lifestyle y rutinas diarias.'
  },
  {
    id: 'm2',
    name: 'Modelo B (Sofia)',
    handle: '@sofia_fit',
    color: '#10b981',
    avatarUrl: '',
    socialLink: 'https://instagram.com',
    notes: 'Contenido de fitness, suplementos y nutrición.'
  },
  {
    id: 'm3',
    name: 'Cuenta Personal',
    handle: '@mi_estudio',
    color: '#6366f1',
    avatarUrl: '',
    socialLink: 'https://youtube.com',
    notes: 'Behind the scenes del estudio de edición y consejos.'
  }
];

// --- INITIAL SEED VIDEOS ---
const SEED_VIDEOS = [
  {
    id: 'v1',
    modelId: 'm1',
    title: 'Transición de Outfits Otoño / Invierno',
    referenceLink: 'https://www.instagram.com/reels/',
    mediaUrl: '',
    notes: 'Transición rápida con chasquido de dedos al ritmo del audio tendencia de la semana.',
    status: 'Inspiration',
    targetDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    platforms: ['Instagram', 'TikTok'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'v2',
    modelId: 'm1',
    title: 'Get Ready With Me (GRWM) para evento',
    referenceLink: 'https://www.tiktok.com/',
    mediaUrl: '',
    notes: 'Un vídeo así haré esta semana. Estilo dinámico con voz en off contando una anécdota.',
    status: 'En Producción',
    targetDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    platforms: ['TikTok', 'Instagram'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'v3',
    modelId: 'm2',
    title: '5 Errores comunes en Sentadilla',
    referenceLink: 'https://youtube.com/shorts/',
    mediaUrl: '',
    notes: 'Explicación técnica en los primeros 3 segundos. Texto en pantalla llamativo.',
    status: 'Listo para subir',
    targetDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    platforms: ['YouTube Shorts', 'Instagram'],
    createdAt: new Date().toISOString()
  }
];

const STATUS_COLUMNS = [
  { id: 'Inspiration', title: '💡 Idea / Inspo' },
  { id: 'En Producción', title: '🎬 En Producción' },
  { id: 'Listo para subir', title: '✅ Listo para subir' },
  { id: 'Publicado', title: '🚀 Publicado' }
];

const PLATFORM_OPTIONS = ['TikTok', 'Instagram', 'YouTube Shorts', 'Facebook Reels'];

// --- ATOMIC STORAGE HELPERS ---
const STORAGE_KEYS = {
  USERS: 'cps_db_users_v2',
  MODELS: 'cps_db_models_v2',
  VIDEOS: 'cps_db_videos_v2',
  INIT: 'cps_db_initialized_v2',
  CURRENT_USER: 'cps_current_user_v2',
  THEME: 'cps_theme_v2'
};

function getStoredData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('Storage Read Error:', e);
    return fallback;
  }
}

function saveStoredData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage Write Error:', e);
  }
}

export default function App() {
  // Initialize Database once
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
  
  // Toast Feedback State
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'danger' }

  // Modals
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [readOnlyViewItem, setReadOnlyViewItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'video' | 'model' | 'user', id, title }
  const [previewMedia, setPreviewMedia] = useState(null);

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
    platforms: ['Instagram']
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

  // --- INITIAL LOAD & SEEDING ---
  useEffect(() => {
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INIT);

    if (!isInitialized) {
      saveStoredData(STORAGE_KEYS.USERS, SEED_USERS);
      saveStoredData(STORAGE_KEYS.MODELS, SEED_MODELS);
      saveStoredData(STORAGE_KEYS.VIDEOS, SEED_VIDEOS);
      localStorage.setItem(STORAGE_KEYS.INIT, 'true');
    }

    setUsers(getStoredData(STORAGE_KEYS.USERS, SEED_USERS));
    setModels(getStoredData(STORAGE_KEYS.MODELS, SEED_MODELS));
    setVideos(getStoredData(STORAGE_KEYS.VIDEOS, SEED_VIDEOS));
    setCurrentUser(getStoredData(STORAGE_KEYS.CURRENT_USER, null));
    
    const savedTheme = getStoredData(STORAGE_KEYS.THEME, true);
    setDarkMode(savedTheme);

    setIsDataLoaded(true);
  }, []);

  // Theme Toggler
  useEffect(() => {
    if (!isDataLoaded) return;
    saveStoredData(STORAGE_KEYS.THEME, darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode, isDataLoaded]);

  // Toast Trigger Helper
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
      saveStoredData(STORAGE_KEYS.CURRENT_USER, matched);
      setUserFormData({ name: '', username: '', password: '', role: 'Lector' });
      showToast(`¡Bienvenido/a, ${matched.name || matched.username}!`);
    } else {
      showToast('Credenciales incorrectas.', 'danger');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setViewMode('models');
    showToast('Sesión cerrada');
  };

  const isAdmin = currentUser?.role === 'Admin';

  // --- ATOMIC CRUD: VIDEOS ---
  const handleVideoSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin || !videoFormData.title.trim()) return;

    let nextVideos;
    if (editingItem) {
      nextVideos = videos.map((v) => (v.id === editingItem.id ? { ...videoFormData, id: v.id } : v));
      showToast('Vídeo actualizado correctamente');
    } else {
      const newVideo = {
        ...videoFormData,
        id: 'vid_' + Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      nextVideos = [newVideo, ...videos];
      showToast('Nuevo vídeo guardado');
    }

    setVideos(nextVideos);
    saveStoredData(STORAGE_KEYS.VIDEOS, nextVideos);
    closeVideoModal();
  };

  const openNewVideoModal = (defaultModelId = null) => {
    if (!isAdmin) return;
    setEditingItem(null);
    setVideoFormData({
      modelId: defaultModelId || (selectedModelFilter !== 'all' ? selectedModelFilter : (models[0]?.id || '')),
      title: '',
      referenceLink: '',
      mediaUrl: '',
      notes: 'Un vídeo así haré esta semana',
      status: 'Inspiration',
      targetDate: new Date().toISOString().split('T')[0],
      platforms: ['Instagram', 'TikTok']
    });
    setIsVideoModalOpen(true);
  };

  const handleEditVideo = (item) => {
    if (!isAdmin) {
      setReadOnlyViewItem(item);
      return;
    }
    setEditingItem(item);
    setVideoFormData(item);
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setEditingItem(null);
  };

  // --- ATOMIC CRUD: MODELS ---
  const handleModelSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin || !modelFormData.name.trim()) return;

    let nextModels;
    if (editingModel) {
      nextModels = models.map((m) => (m.id === editingModel.id ? { ...modelFormData, id: m.id } : m));
      showToast('Perfil de modelo actualizado');
    } else {
      const newModel = {
        ...modelFormData,
        id: 'mod_' + Date.now().toString()
      };
      nextModels = [...models, newModel];
      showToast('Modelo creada con éxito');
    }

    setModels(nextModels);
    saveStoredData(STORAGE_KEYS.MODELS, nextModels);
    closeModelModal();
  };

  const handleEditModel = (model) => {
    if (!isAdmin) return;
    setEditingModel(model);
    setModelFormData(model);
    setIsModelModalOpen(true);
  };

  const closeModelModal = () => {
    setIsModelModalOpen(false);
    setEditingModel(null);
    setModelFormData({ name: '', handle: '', color: '#6366f1', avatarUrl: '', socialLink: '', notes: '' });
  };

  // --- ATOMIC CRUD: USERS ---
  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin || !userFormData.username.trim() || !userFormData.password.trim()) return;

    let nextUsers;
    if (editingUser) {
      nextUsers = users.map((u) => (u.id === editingUser.id ? { ...userFormData, id: u.id } : u));
      if (editingUser.id === currentUser.id) {
        const updatedSelf = { ...userFormData, id: currentUser.id };
        setCurrentUser(updatedSelf);
        saveStoredData(STORAGE_KEYS.CURRENT_USER, updatedSelf);
      }
      showToast('Usuario modificado');
    } else {
      const newUser = {
        ...userFormData,
        id: 'usr_' + Date.now().toString()
      };
      nextUsers = [...users, newUser];
      showToast('Nuevo usuario creado');
    }

    setUsers(nextUsers);
    saveStoredData(STORAGE_KEYS.USERS, nextUsers);
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

  // --- ABSOLUTE DELETE EXECUTION (NO REVERT) ---
  const requestDelete = (type, id, title) => {
    if (!isAdmin) return;
    if (type === 'user' && id === currentUser.id) {
      showToast('No puedes eliminar tu propio usuario activo.', 'danger');
      return;
    }
    setDeleteConfirm({ type, id, title });
  };

  const executeDelete = () => {
    if (!deleteConfirm || !isAdmin) return;

    const { type, id } = deleteConfirm;

    if (type === 'video') {
      const nextVideos = videos.filter((v) => v.id !== id);
      setVideos(nextVideos);
      saveStoredData(STORAGE_KEYS.VIDEOS, nextVideos);
      showToast('Vídeo eliminado correctamente');
    } else if (type === 'model') {
      // 1. Remove Model
      const nextModels = models.filter((m) => m.id !== id);
      setModels(nextModels);
      saveStoredData(STORAGE_KEYS.MODELS, nextModels);

      // 2. Remove all attached videos for this model
      const nextVideos = videos.filter((v) => v.modelId !== id);
      setVideos(nextVideos);
      saveStoredData(STORAGE_KEYS.VIDEOS, nextVideos);

      if (selectedModelFilter === id) {
        setSelectedModelFilter('all');
      }
      showToast('Modelo y sus vídeos fueron eliminados');
    } else if (type === 'user') {
      const nextUsers = users.filter((u) => u.id !== id);
      setUsers(nextUsers);
      saveStoredData(STORAGE_KEYS.USERS, nextUsers);
      showToast('Usuario eliminado');
    }

    setDeleteConfirm(null);
  };

  // --- FILE UPLOADS ---
  const handleVideoFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        showToast('El archivo supera los 30MB recomendados.', 'danger');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoFormData((prev) => ({ ...prev, mediaUrl: reader.result }));
        showToast('Borrador cargado');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('La imagen supera los 5MB.', 'danger');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setModelFormData((prev) => ({ ...prev, avatarUrl: reader.result }));
        showToast('Foto cargada');
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculated Maps & Filters
  const filteredVideos = useMemo(() => {
    return videos.filter((item) => {
      const matchesModel = selectedModelFilter === 'all' || item.modelId === selectedModelFilter;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesModel && matchesSearch;
    });
  }, [videos, selectedModelFilter, searchQuery]);

  const modelMap = useMemo(() => {
    return models.reduce((acc, m) => {
      acc[m.id] = m;
      return acc;
    }, {});
  }, [models]);

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
        
        {/* Toast alert */}
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
                <p className="text-xs text-slate-400">Planificador de Vídeos</p>
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
              <p className="text-xs text-slate-400">Modelos & Creadoras</p>
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
          <Eye className="w-4 h-4" /> Modo de Solo Lectura: Has iniciado sesión como usuario Lector.
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
            {(selectedModelFilter === 'all' 
              ? models 
              : models.filter((m) => m.id === selectedModelFilter)
            ).map((model) => {
              const modelVideos = filteredVideos.filter((item) => item.modelId === model.id);

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
                      <VideoCard 
                        key={item.id} 
                        item={item} 
                        model={modelMap[item.modelId]}
                        darkMode={darkMode} 
                        isAdmin={isAdmin}
                        onEdit={handleEditVideo} 
                        onDelete={() => requestDelete('video', item.id, item.title)}
                        onPreviewMedia={(url) => setPreviewMedia(url)}
                      />
                    ))}

                    {modelVideos.length === 0 && (
                      <div className="col-span-full py-8 text-center text-xs text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        No hay vídeos planeados para {model.name}.
                      </div>
                    )}
                  </div>

                </div>
              );
            })}

            {models.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
                No hay modelos registradas.
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: MONTHLY CALENDAR */}
        {viewMode === 'calendar' && (
          <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-500" /> Planificador Mensual
            </h3>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">
              <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }).map((_, index) => {
                const dayNum = index + 1;
                const dayItems = filteredVideos.filter((item) => {
                  if (!item.targetDate) return false;
                  return new Date(item.targetDate).getDate() === dayNum;
                });

                return (
                  <div
                    key={dayNum}
                    className={`min-h-[100px] border rounded-xl p-2 flex flex-col justify-between ${
                      darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-400">{dayNum}</span>

                    <div className="space-y-1 my-1 overflow-y-auto max-h-[80px]">
                      {dayItems.map((item) => {
                        const m = modelMap[item.modelId];
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleEditVideo(item)}
                            className="text-[10px] p-1.5 rounded-md text-white truncate cursor-pointer hover:opacity-80 transition-opacity font-medium"
                            style={{ backgroundColor: m?.color || '#6366f1' }}
                            title={`${m?.name || ''}: ${item.title}`}
                          >
                            {item.title}
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

        {/* VIEW 3: USER MANAGEMENT PANEL */}
        {viewMode === 'users' && isAdmin && (
          <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Gestión de Usuarios y Roles
                </h3>
                <p className="text-xs text-slate-400">Crea, edita o elimina credenciales de la plataforma</p>
              </div>

              <button
                onClick={openNewUserModal}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Crear Nuevo Usuario
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((usr) => (
                <div
                  key={usr.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        usr.role === 'Admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {usr.role}
                      </span>
                      {usr.id === currentUser.id && (
                        <span className="text-[10px] text-emerald-400 font-medium">Sesión Actual</span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm">{usr.name || usr.username}</h4>
                    <p className="text-xs text-slate-400 mb-2">Usuario: <span className="font-mono text-slate-200">{usr.username}</span></p>
                    <p className="text-xs text-slate-500 mb-4">Clave: <span className="font-mono">••••••••</span></p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => handleEditUser(usr)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                      title="Editar Usuario"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => requestDelete('user', usr.id, usr.username)}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30"
                      disabled={usr.id === currentUser.id}
                      title="Eliminar Usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirm && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-6 space-y-4 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base">
                ¿Eliminar {deleteConfirm.type === 'video' ? 'vídeo' : deleteConfirm.type === 'model' ? 'modelo' : 'usuario'}?
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                «{deleteConfirm.title}»
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Esta acción no se puede deshacer.</p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT VIDEO MODAL */}
      {isVideoModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                {editingItem ? 'Editar Vídeo' : 'Nuevo Vídeo Planeado'}
              </h3>
              <button onClick={closeVideoModal} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVideoSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Modelo / Creadora *</label>
                <select
                  value={videoFormData.modelId}
                  onChange={(e) => setVideoFormData({ ...videoFormData, modelId: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none font-medium ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.handle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Título / Concepto del vídeo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Transición con ropa de verano"
                  value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Link de referencia / Inspo</label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://tiktok.com/... o instagram.com/reel/..."
                    value={videoFormData.referenceLink}
                    onChange={(e) => setVideoFormData({ ...videoFormData, referenceLink: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Subir Borrador o Muestra</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="video/*" onChange={handleVideoFileUpload} className="hidden" id="modal-video-upload" />
                  <label
                    htmlFor="modal-video-upload"
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-xl text-xs cursor-pointer hover:border-indigo-500 transition-colors ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-indigo-500" />
                    {videoFormData.mediaUrl ? 'Cambiar borrador' : 'Adjuntar archivo de vídeo'}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Estado</label>
                  <select
                    value={videoFormData.status}
                    onChange={(e) => setVideoFormData({ ...videoFormData, status: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {STATUS_COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Fecha Planificada</label>
                  <input
                    type="date"
                    value={videoFormData.targetDate}
                    onChange={(e) => setVideoFormData({ ...videoFormData, targetDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Plataformas</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map((plat) => {
                    const isSelected = videoFormData.platforms?.includes(plat);
                    return (
                      <button
                        type="button"
                        key={plat}
                        onClick={() => {
                          const exists = videoFormData.platforms?.includes(plat);
                          setVideoFormData({
                            ...videoFormData,
                            platforms: exists 
                              ? videoFormData.platforms.filter((p) => p !== plat)
                              : [...(videoFormData.platforms || []), plat]
                          });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        {plat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Notas / Idea de Ejecución</label>
                <textarea
                  rows="3"
                  placeholder="Ej: Un vídeo así haré esta semana..."
                  value={videoFormData.notes}
                  onChange={(e) => setVideoFormData({ ...videoFormData, notes: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeVideoModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-indigo-600 text-white hover:opacity-90 transition-all"
                >
                  {editingItem ? 'Guardar Cambios' : 'Crear Vídeo'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODEL MODAL */}
      {isModelModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <User className="w-5 h-5 text-pink-500" />
                {editingModel ? 'Editar Modelo' : 'Nueva Modelo / Cuenta'}
              </h3>
              <button onClick={closeModelModal} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModelSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Foto de Perfil / Avatar</label>
                <div className="flex items-center gap-3">
                  {modelFormData.avatarUrl ? (
                    <img src={modelFormData.avatarUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      placeholder="URL de foto o imagen (https://...)"
                      value={modelFormData.avatarUrl}
                      onChange={(e) => setModelFormData({ ...modelFormData, avatarUrl: e.target.value })}
                      className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none ${
                        darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />

                    <div className="flex items-center gap-2">
                      <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" id="modal-avatar-upload" />
                      <label
                        htmlFor="modal-avatar-upload"
                        className="text-[11px] font-semibold text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Subir desde dispositivo
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Nombre de la Modelo / Canal *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Modelo A (Elena)"
                  value={modelFormData.name}
                  onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Usuario / Handle (@)</label>
                <input
                  type="text"
                  placeholder="@elena_official"
                  value={modelFormData.handle}
                  onChange={(e) => setModelFormData({ ...modelFormData, handle: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Enlace Social / Portafolio / Drive</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://instagram.com/perfil o drive.google.com/..."
                    value={modelFormData.socialLink}
                    onChange={(e) => setModelFormData({ ...modelFormData, socialLink: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Color Distintivo</label>
                <input
                  type="color"
                  value={modelFormData.color}
                  onChange={(e) => setModelFormData({ ...modelFormData, color: e.target.value })}
                  className="w-full h-10 rounded-xl border cursor-pointer border-slate-800 bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Notas / Enfoque del perfil</label>
                <textarea
                  rows="2"
                  placeholder="Temática principal, estilo, horarios..."
                  value={modelFormData.notes}
                  onChange={(e) => setModelFormData({ ...modelFormData, notes: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModelModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all"
                >
                  {editingModel ? 'Guardar Cambios' : 'Crear Modelo'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isUserModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={closeUserModal} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej: Laura Pérez"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Nombre de Usuario *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: laura_editor"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Contraseña *</label>
                <input
                  type="text"
                  required
                  placeholder="••••••••"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Rol asignado</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="Lector">Lector (Solo Visualización)</option>
                  <option value="Admin">Administrador (Control Total)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeUserModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* READ ONLY VIDEO MODAL FOR LECTOR */}
      {readOnlyViewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setReadOnlyViewItem(null)}>
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Detalle de Vídeo (Solo Lectura)
              </span>
              <button onClick={() => setReadOnlyViewItem(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-bold text-base">{readOnlyViewItem.title}</h3>

            {readOnlyViewItem.notes && (
              <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                «{readOnlyViewItem.notes}»
              </p>
            )}

            {readOnlyViewItem.referenceLink && (
              <a
                href={readOnlyViewItem.referenceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir Enlace de Referencia
              </a>
            )}

            {readOnlyViewItem.mediaUrl && (
              <video src={readOnlyViewItem.mediaUrl} controls className="w-full rounded-xl border border-slate-800 max-h-60 object-cover" />
            )}
          </div>
        </div>
      )}

      {/* MEDIA PREVIEW MODAL */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setPreviewMedia(null)}>
          <div className="relative max-w-sm w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>
            <video src={previewMedia} controls autoPlay className="w-full max-h-[70vh] object-cover" />
          </div>
        </div>
      )}

    </div>
  );
}

// --- VIDEO CARD COMPONENT ---
function VideoCard({ item, model, darkMode, isAdmin, onEdit, onDelete, onPreviewMedia }) {
  return (
    <div className={`group relative rounded-2xl border p-4 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${
      darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
    }`}>
      
      <div className="flex items-center justify-between gap-2 mb-2">
        {model ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-1 shadow-sm" style={{ backgroundColor: model.color }}>
            {model.avatarUrl ? (
              <img src={model.avatarUrl} alt="" className="w-3 h-3 rounded-full object-cover" />
            ) : (
              <User className="w-3 h-3" />
            )}
            {model.name}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">Sin modelo</span>
        )}

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button onClick={() => onEdit(item)} className="p-1 text-slate-400 hover:text-indigo-400" title={isAdmin ? 'Editar' : 'Ver Detalles'}>
            {isAdmin ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
          </button>
          {isAdmin && (
            <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-400" title="Eliminar">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <h4 className="font-bold text-sm leading-snug mb-2 line-clamp-2">{item.title}</h4>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
        {item.targetDate && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>{new Date(item.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400">
          {item.status}
        </span>
      </div>

      {item.mediaUrl && (
        <div 
          onClick={() => onPreviewMedia(item.mediaUrl)}
          className="relative my-2 rounded-xl overflow-hidden bg-slate-950 h-32 cursor-pointer group/video flex items-center justify-center border border-slate-800"
        >
          <video src={item.mediaUrl} className="w-full h-full object-cover opacity-80 group-hover/video:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/video:bg-black/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
          </div>
        </div>
      )}

      {item.notes && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 font-medium">
          «{item.notes}»
        </p>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-wrap gap-1">
          {item.platforms?.map((p) => (
            <span key={p} className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {p}
            </span>
          ))}
        </div>

        {item.referenceLink && (
          <a
            href={item.referenceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:text-indigo-400"
          >
            <ExternalLink className="w-3 h-3" /> Abrir Ref
          </a>
        )}
      </div>

    </div>
  );
}
