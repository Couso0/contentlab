import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, CheckCircle2, Clock, PlayCircle, X, 
  ExternalLink, User, Lock, LogOut, Video, Search, ChevronRight,
  ShieldCheck, ShieldAlert
} from 'lucide-react';

const SUPABASE_URL = 'https://eeksouotnjqhfxywfuvh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yn1K0PuqxX6fZehRQBmqAw_wArBvDf_'; // <--- Pega aquí la clave de tu captura

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);

  const [activeTab, setActiveTab] = useState('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modales
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [modelForm, setModelForm] = useState({ id: null, name: '', handle: '', avatar: '', link: '' });

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoForm, setVideoForm] = useState({
    id: null,
    title: '',
    status: 'POR_GRABAR',
    scheduled_date: '',
    platform: 'Instagram',
    notes: '',
    reference_url: '',
    media_url: '',
    model_id: ''
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ id: null, username: '', password: '', role: 'Lector' });

  // Cargar datos desde Supabase
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!supabase) return;

    const { data: modelsData } = await supabase.from('models').select('*');
    if (modelsData) {
      setModels(modelsData);
      if (modelsData.length > 0 && !selectedModelId) {
        setSelectedModelId(modelsData[0].id);
      }
    }

    const { data: videosData } = await supabase.from('videos').select('*');
    if (videosData) setVideos(videosData);

    const { data: usersData } = await supabase.from('app_users').select('*');
    if (usersData) {
      setUsers(usersData);
    } else {
      // Usuarios por defecto si está vacía
      const defaultUsers = [
        { id: '1', username: 'Mariapcmg', password: 'Miranda09*', role: 'Admin' },
        { id: '2', username: 'Lector', password: 'Lector1234', role: 'Lector' }
      ];
      await supabase.from('app_users').insert(defaultUsers);
      setUsers(defaultUsers);
    }
  };

  // Auth Login
  const handleLogin = (e) => {
    e.preventDefault();
    const found = users.find(
      u => u.username.toLowerCase() === loginForm.username.toLowerCase() && u.password === loginForm.password
    );
    if (found) {
      setCurrentUser(found);
      setLoginError('');
    } else {
      setLoginError('Usuario o contraseña incorrectos');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
  };

  // CRUD Modelos
  const handleSaveModel = async (e) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') return;

    if (modelForm.id) {
      await supabase.from('models').update({
        name: modelForm.name,
        handle: modelForm.handle,
        avatar: modelForm.avatar,
        link: modelForm.link
      }).eq('id', modelForm.id);
    } else {
      const newModel = { ...modelForm, id: Date.now().toString() };
      await supabase.from('models').insert([newModel]);
      if (!selectedModelId) setSelectedModelId(newModel.id);
    }
    fetchData();
    setIsModelModalOpen(false);
  };

  const handleDeleteModel = async (id) => {
    if (currentUser?.role !== 'Admin') return;
    if (confirm('¿Eliminar esta modelo y sus videos asociados?')) {
      await supabase.from('models').delete().eq('id', id);
      await supabase.from('videos').delete().eq('model_id', id);
      fetchData();
      if (selectedModelId === id) setSelectedModelId(null);
    }
  };

  // CRUD Videos
  const handleSaveVideo = async (e) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') return;

    const payload = {
      ...videoForm,
      model_id: videoForm.model_id || selectedModelId
    };

    if (videoForm.id) {
      await supabase.from('videos').update(payload).eq('id', videoForm.id);
    } else {
      await supabase.from('videos').insert([{ ...payload, id: Date.now().toString() }]);
    }
    fetchData();
    setIsVideoModalOpen(false);
  };

  const handleDeleteVideo = async (id) => {
    if (currentUser?.role !== 'Admin') return;
    if (confirm('¿Eliminar este video?')) {
      await supabase.from('videos').delete().eq('id', id);
      fetchData();
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (currentUser?.role !== 'Admin') return;
    await supabase.from('videos').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-3">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Content Planner Studio</h1>
            <p className="text-slate-400 text-sm mt-1">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Usuario</label>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Contraseña</label>
              <input
                type="password"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>

            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition">
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  const selectedModel = models.find(m => m.id === selectedModelId);
  const filteredVideos = videos.filter(v => {
    const matchModel = v.model_id === selectedModelId;
    const matchSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchModel && matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Content Planner Studio</h1>
            <span className="text-xs text-emerald-400 flex items-center gap-1">● Sincronizado en la nube</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-300">
            Hola, <strong className="text-white">{currentUser.username}</strong> ({currentUser.role})
          </span>
          <button onClick={handleLogout} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Modelos */}
        <aside className="w-72 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Modelos</h2>
            {currentUser.role === 'Admin' && (
              <button
                onClick={() => {
                  setModelForm({ id: null, name: '', handle: '', avatar: '', link: '' });
                  setIsModelModalOpen(true);
                }}
                className="p-1 hover:bg-slate-800 text-indigo-400 rounded transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {models.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedModelId(m.id)}
                className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition ${
                  selectedModelId === m.id ? 'bg-indigo-600/20 border border-indigo-500/50' : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-sm text-white">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.handle}</p>
                  </div>
                </div>
                {currentUser.role === 'Admin' && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteModel(m.id); }} className="text-slate-500 hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Dashboard principal */}
        <main className="flex-1 p-6 overflow-y-auto">
          {selectedModel ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedModel.name}</h2>
                  <p className="text-sm text-slate-400">{selectedModel.handle}</p>
                </div>
                {currentUser.role === 'Admin' && (
                  <button
                    onClick={() => {
                      setVideoForm({
                        id: null,
                        title: '',
                        status: 'POR_GRABAR',
                        scheduled_date: '',
                        platform: 'Instagram',
                        notes: '',
                        reference_url: '',
                        media_url: '',
                        model_id: selectedModelId
                      });
                      setIsVideoModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-medium transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Video</span>
                  </button>
                )}
              </div>

              {/* Grid de Videos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVideos.map(v => (
                  <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          v.status === 'LISTO' ? 'bg-emerald-500/10 text-emerald-400' :
                          v.status === 'EDITANDO' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {v.status}
                        </span>
                        {currentUser.role === 'Admin' && (
                          <button onClick={() => handleDeleteVideo(v.id)} className="text-slate-500 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <h3 className="font-semibold text-white mb-1">{v.title}</h3>
                      <p className="text-xs text-slate-400 mb-3">{v.platform} • {v.scheduled_date}</p>
                      {v.notes && <p className="text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-lg mb-3">{v.notes}</p>}
                    </div>

                    {currentUser.role === 'Admin' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <button onClick={() => handleStatusChange(v.id, 'POR_GRABAR')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded">Por Grab</button>
                        <button onClick={() => handleStatusChange(v.id, 'EDITANDO')} className="text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2 py-1 rounded">Editando</button>
                        <button onClick={() => handleStatusChange(v.id, 'LISTO')} className="text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-2 py-1 rounded">Listo</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Selecciona una modelo para ver su planificación.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
