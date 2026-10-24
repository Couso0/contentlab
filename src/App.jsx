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
  
  // Toast Feedback State
  const [toast, setToast] = useState(null);

  // Modals
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [readOnlyViewItem, setReadOnlyViewItem] = useState(null);
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

  // --- CARGAR DATOS DESDE SUPABASE ---
  useEffect(() => {
    loadCloudData();
  }, []);

  const loadCloudData = async () => {
    if (!supabase) {
      // Fallback a localStorage si supabase no está disponible
      setUsers(JSON.parse(localStorage.getItem('cps_db_users_v2')) || SEED_USERS);
      setModels(JSON.parse(localStorage.getItem('cps_db_models_v2')) || SEED_MODELS);
      setVideos(JSON.parse(localStorage.getItem('cps_db_videos_v2')) || SEED_VIDEOS);
      setCurrentUser(JSON.parse(localStorage.getItem('cps_current_user_v2')) || null);
      setIsDataLoaded(true);
      return;
    }

    try {
      // 1. Usuarios
      const { data: dbUsers } = await supabase.from('app_users').select('*');
      if (dbUsers && dbUsers.length > 0) {
        setUsers(dbUsers);
      } else {
        await supabase.from('app_users').insert(SEED_USERS);
        setUsers(SEED_USERS);
      }

      // 2. Modelos
      const { data: dbModels } = await supabase.from('models').select('*');
      if (dbModels && dbModels.length > 0) {
        setModels(dbModels);
      } else {
        await supabase.from('models').insert(SEED_MODELS);
        setModels(SEED_MODELS);
      }

      // 3. Vídeos
      const { data: dbVideos } = await supabase.from('videos').select('*');
      if (dbVideos && dbVideos.length > 0) {
        setVideos(dbVideos);
      } else {
        await supabase.from('videos').insert(SEED_VIDEOS);
        setVideos(SEED_VIDEOS);
      }

      // Cargar sesión guardada localmente
      const savedUser = localStorage.getItem('cps_current_user_v2');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

    } catch (err) {
      console.error('Error cargando desde Supabase:', err);
    } finally {
      setIsDataLoaded(true);
    }
  };

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

  // --- CRUD: VIDEOS (SUPABASE) ---
  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !videoFormData.title.trim()) return;

    if (editingItem) {
      const updated = { ...videoFormData, id: editingItem.id };
      if (supabase) {
        await supabase.from('videos').update(updated).eq('id', editingItem.id);
      }
      setVideos(videos.map((v) => (v.id === editingItem.id ? updated : v)));
      showToast('Vídeo actualizado correctamente');
    } else {
      const newVideo = {
        ...videoFormData,
        id: 'vid_' + Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      if (supabase) {
        await supabase.from('videos').insert([newVideo]);
      }
      setVideos([newVideo, ...videos]);
      showToast('Nuevo vídeo guardado');
    }
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

  // --- CRUD: MODELS (SUPABASE) ---
  const handleModelSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !modelFormData.name.trim()) return;

    if (editingModel) {
      const updated = { ...modelFormData, id: editingModel.id };
      if (supabase) {
        await supabase.from('models').update(updated).eq('id', editingModel.id);
      }
      setModels(models.map((m) => (m.id === editingModel.id ? updated : m)));
      showToast('Perfil de modelo actualizado');
    } else {
      const newModel = {
        ...modelFormData,
        id: 'mod_' + Date.now().toString()
      };
      if (supabase) {
        await supabase.from('models').insert([newModel]);
      }
      setModels([...models, newModel]);
      showToast('Modelo creada con éxito');
    }
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
      }
      setModels(models.filter((m) => m.id !== id));
      setVideos(videos.filter((v) => v.modelId !== id));
      if (selectedModelFilter === id) setSelectedModelFilter('all');
      showToast('Modelo y sus vídeos fueron eliminados');
    }

    setDeleteConfirm(null);
  };

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
              <span className="text-[10px] text-emerald-400 font-semibold">● Cloud Synced</span>
            </div>
          </div>

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

          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
              <div className="flex flex-col">
                <span className="font-bold">{currentUser.username}</span>
                <span className="text-[10px] text-slate-400">{isAdmin ? 'Admin' : 'Lector'}</span>
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

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                          <a href={model.socialLink} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-400 hover:text-indigo-400">
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
                        <button onClick={() => handleEditModel(model)} className="p-1.5 text-slate-400 hover:text-slate-200">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => requestDelete('model', model.id, model.name)} className="p-1.5 text-slate-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Video Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modelVideos.map((item) => (
                    <div key={item.id} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between gap-4`}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {item.status}
                          </span>
                          <span className="text-xs text-slate-400">{item.targetDate}</span>
                        </div>
                        <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                        {item.notes && <p className="text-xs text-slate-400 line-clamp-2">{item.notes}</p>}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{item.platforms?.[0] || 'Social'}</span>
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditVideo(item)} className="p-1 text-slate-400 hover:text-slate-200">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => requestDelete('video', item.id, item.title)} className="p-1 text-slate-400 hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {modelVideos.length === 0 && (
                    <div className="col-span-full py-6 text-center text-xs text-slate-500">
                      No hay vídeos en esta sección.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL VÍDEO */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border bg-slate-900 border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingItem ? 'Editar Vídeo' : 'Nuevo Vídeo'}</h3>
              <button onClick={closeVideoModal} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleVideoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Modelo</label>
                <select
                  value={videoFormData.modelId}
                  onChange={(e) => setVideoFormData({ ...videoFormData, modelId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Título</label>
                <input
                  type="text"
                  required
                  value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Estado</label>
                  <select
                    value={videoFormData.status}
                    onChange={(e) => setVideoFormData({ ...videoFormData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                  >
                    <option value="Inspiration">💡 Idea / Inspo</option>
                    <option value="En Producción">🎬 En Producción</option>
                    <option value="Listo para subir">✅ Listo para subir</option>
                    <option value="Publicado">🚀 Publicado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Fecha Objetivo</label>
                  <input
                    type="date"
                    value={videoFormData.targetDate}
                    onChange={(e) => setVideoFormData({ ...videoFormData, targetDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Notas</label>
                <textarea
                  rows="3"
                  value={videoFormData.notes}
                  onChange={(e) => setVideoFormData({ ...videoFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={closeVideoModal} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODELO */}
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
                  value={modelFormData.name}
                  onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Handle</label>
                <input
                  type="text"
                  value={modelFormData.handle}
                  onChange={(e) => setModelFormData({ ...modelFormData, handle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={closeModelModal} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border bg-slate-900 border-slate-800 p-6 text-center shadow-2xl text-slate-100">
            <h3 className="text-base font-bold mb-2">¿Estás segura?</h3>
            <p className="text-xs text-slate-400 mb-6">Vas a eliminar <strong className="text-white">"{deleteConfirm.title}"</strong>.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs">Cancelar</button>
              <button onClick={executeDelete} className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-xs">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
