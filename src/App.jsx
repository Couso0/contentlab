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

// --- INITIAL SEED USERS (Fallback si la BD está vacía) ---
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
    fetchDataFromSupabase();
  }, []);

  const fetchDataFromSupabase = async () => {
    if (!supabase) {
      setIsDataLoaded(true);
      return;
    }

    try {
      // 1. Cargar Usuarios
      const { data: usersData, error: userError } = await supabase.from('app_users').select('*');
      if (usersData && usersData.length > 0) {
        setUsers(usersData);
      } else {
        // Sembrar usuarios si está vacío
        await supabase.from('app_users').insert(SEED_USERS);
        setUsers(SEED_USERS);
      }

      // 2. Cargar Modelos
      const { data: modelsData } = await supabase.from('models').select('*');
      if (modelsData) setModels(modelsData);

      // 3. Cargar Vídeos
      const { data: videosData } = await supabase.from('videos').select('*');
      if (videosData) setVideos(videosData);

    } catch (e) {
      console.error('Error sincronizando con Supabase:', e);
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
      setUserFormData({ name: '', username: '', password: '', role: 'Lector' });
      showToast(`¡Bienvenido/a, ${matched.name || matched.username}!`);
    } else {
      showToast('Credenciales incorrectas.', 'danger');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode('models');
    showToast('Sesión cerrada');
  };

  const isAdmin = currentUser?.role === 'Admin';

  // --- CRUD: VIDEOS (SUPABASE) ---
  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !videoFormData.title.trim() || !supabase) return;

    if (editingItem) {
      const { error } = await supabase.from('videos').update({
        modelId: videoFormData.modelId,
        title: videoFormData.title,
        referenceLink: videoFormData.referenceLink,
        mediaUrl: videoFormData.mediaUrl,
        notes: videoFormData.notes,
        status: videoFormData.status,
        targetDate: videoFormData.targetDate,
        platforms: videoFormData.platforms
      }).eq('id', editingItem.id);

      if (!error) showToast('Vídeo actualizado correctamente');
    } else {
      const newVideo = {
        ...videoFormData,
        id: 'vid_' + Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      const { error } = await supabase.from('videos').insert([newVideo]);
      if (!error) showToast('Nuevo vídeo guardado');
    }

    fetchDataFromSupabase();
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
    if (!isAdmin || !modelFormData.name.trim() || !supabase) return;

    if (editingModel) {
      await supabase.from('models').update({
        name: modelFormData.name,
        handle: modelFormData.handle,
        color: modelFormData.color,
        avatarUrl: modelFormData.avatarUrl,
        socialLink: modelFormData.socialLink,
        notes: modelFormData.notes
      }).eq('id', editingModel.id);
      showToast('Perfil de modelo actualizado');
    } else {
      const newModel = {
        ...modelFormData,
        id: 'mod_' + Date.now().toString()
      };
      await supabase.from('models').insert([newModel]);
      showToast('Modelo creada con éxito');
    }

    fetchDataFromSupabase();
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

  // --- CRUD: USERS (SUPABASE) ---
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !userFormData.username.trim() || !userFormData.password.trim() || !supabase) return;

    if (editingUser) {
      await supabase.from('app_users').update({
        name: userFormData.name,
        username: userFormData.username,
        password: userFormData.password,
        role: userFormData.role
      }).eq('id', editingUser.id);
      showToast('Usuario modificado');
    } else {
      const newUser = {
        ...userFormData,
        id: 'usr_' + Date.now().toString()
      };
      await supabase.from('app_users').insert([newUser]);
      showToast('Nuevo usuario creado');
    }

    fetchDataFromSupabase();
    closeUserModal();
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
    if (!deleteConfirm || !isAdmin || !supabase) return;

    const { type, id } = deleteConfirm;

    if (type === 'video') {
      await supabase.from('videos').delete().eq('id', id);
      showToast('Vídeo eliminado correctamente');
    } else if (type === 'model') {
      await supabase.from('models').delete().eq('id', id);
      await supabase.from('videos').delete().eq('modelId', id);
      if (selectedModelFilter === id) setSelectedModelFilter('all');
      showToast('Modelo y sus vídeos fueron eliminados');
    } else if (type === 'user') {
      await supabase.from('app_users').delete().eq('id', id);
      showToast('Usuario eliminado');
    }

    fetchDataFromSupabase();
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold text-white border ${
            toast.type === 'danger' ? 'bg-red-600 border-red-500' : 'bg-emerald-600 border-emerald-500'
          }`}>
            <CheckCircle className="w-4 h-4" /> {toast.message}
          </div>
        )}

        <div className="w-full max-w-md rounded-2xl border shadow-2xl p-6 sm:p-8 bg-slate-900 border-slate-800">
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
                  className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 focus:border-indigo-500 text-white"
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
                  className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 focus:border-indigo-500 text-white"
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold text-white border transition-all ${
          toast.type === 'danger' ? 'bg-red-600 border-red-500' : 'bg-emerald-600 border-emerald-500'
        }`}>
          <CheckCircle className="w-4 h-4" /> {toast.message}
        </div>
      )}

      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-md bg-slate-900/80 border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight tracking-wide">Studio Planner</h1>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">● Cloud Synced</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium bg-slate-950 border-slate-800">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedModelFilter}
                onChange={(e) => setSelectedModelFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold cursor-pointer pr-1 text-white"
              >
                <option value="all" className="bg-slate-900">Todas las Modelos</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900">
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
                className="p-2 rounded-xl border transition-colors bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                title="Añadir Nueva Modelo"
              >
                <User className="w-4 h-4 text-pink-500" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs bg-slate-950 border-slate-800">
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
              <div className="flex flex-col">
                <span className="font-bold text-white">{currentUser.username}</span>
                <span className="text-[10px] text-slate-400">{isAdmin ? 'Admin' : 'Lector'}</span>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => openNewVideoModal()}
                className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Vídeo</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border text-red-400 hover:bg-red-500/10 transition-colors bg-slate-900 border-slate-800"
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
              <div key={model.id} className="rounded-2xl border overflow-hidden bg-slate-900/40 border-slate-800 shadow-sm">
                
                {/* Model Header */}
                <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3 border-slate-800 bg-slate-900/80">
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
                        <h3 className="font-bold text-base text-white">{model.name}</h3>
                        <span className="text-xs text-slate-400">{model.handle}</span>
                        {model.socialLink && (
                          <a href={model.socialLink} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-400 hover:text-indigo-400">
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {model.notes && <p className="text-xs text-slate-400">{model.notes}</p>}
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

                {/* Video Cards Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modelVideos.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            item.status === 'Publicado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            item.status === 'Listo para subir' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            item.status === 'En Producción' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {item.status}
                          </span>

                          <span className="text-xs text-slate-400">{item.targetDate}</span>
                        </div>

                        <h4 className="font-bold text-sm text-white mb-1">{item.title}</h4>
                        {item.notes && <p className="text-xs text-slate-300 line-clamp-2">{item.notes}</p>}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                        <div className="flex gap-1">
                          {item.platforms?.map((p, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{p}</span>
                          ))}
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditVideo(item)} className="p-1 text-slate-400 hover:text-white">
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
                    <div className="col-span-full py-8 text-center text-xs text-slate-500">
                      No hay vídeos registrados para esta modelo.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL: NUEVO/EDITAR VÍDEO */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border bg-slate-900 border-slate-800 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">{editingItem ? 'Editar Vídeo' : 'Nuevo Vídeo'}</h3>
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
                <label className="block text-xs font-semibold mb-1 text-slate-400">Título del Vídeo</label>
                <input
                  type="text"
                  required
                  value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                  placeholder="Ej: GRWM Rutina de Mañana"
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
                <label className="block text-xs font-semibold mb-1 text-slate-400">Notas / Descripción</label>
                <textarea
                  rows="3"
                  value={videoFormData.notes}
                  onChange={(e) => setVideoFormData({ ...videoFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={closeVideoModal} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm">Guardar Vídeo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA/EDITAR MODELO */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-slate-900 border-slate-800 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">{editingModel ? 'Editar Modelo' : 'Nueva Modelo'}</h3>
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
                  placeholder="Ej: Elena Smith"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Handle / Usuario Social</label>
                <input
                  type="text"
                  value={modelFormData.handle}
                  onChange={(e) => setModelFormData({ ...modelFormData, handle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-950 border-slate-800 text-white"
                  placeholder="Ej: @elena_official"
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

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border bg-slate-900 border-slate-800 p-6 text-center shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">¿Estás segura?</h3>
            <p className="text-xs text-slate-400 mb-6">Vas a eliminar <strong className="text-white">"{deleteConfirm.title}"</strong> de forma permanente de la nube.</p>
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
