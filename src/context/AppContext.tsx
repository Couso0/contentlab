import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Model, VideoItem, UserRole, ActiveTab, AppUser } from '../types';
import {
  getModels,
  getVideos,
  saveVideo,
  deleteVideo as removeVideo,
  saveModel,
  deleteModel as removeModel,
  getAppUsers,
  saveAppUser,
  deleteAppUser,
  getStoredCredentials,
} from '../lib/supabase';

interface AppContextType {
  currentUser: AppUser | null;
  users: AppUser[];
  userRole: UserRole;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  upsertUser: (userData: Partial<AppUser> & { name: string; username: string; password: string; role: UserRole }) => Promise<AppUser>;
  deleteUser: (id: string) => Promise<boolean>;
  isUsersModalOpen: boolean;
  setIsUsersModalOpen: (open: boolean) => void;

  models: Model[];
  videos: VideoItem[];
  filteredVideos: VideoItem[];
  selectedModelId: string | 'all';
  setSelectedModelId: (id: string | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeVideo: VideoItem | null;
  setActiveVideo: (video: VideoItem | null) => void;
  isCreateVideoOpen: boolean;
  setIsCreateVideoOpen: (open: boolean) => void;
  preselectedDate: string | null;
  setPreselectedDate: (date: string | null) => void;
  activeModel: Model | null;
  setActiveModel: (model: Model | null) => void;
  isModelModalOpen: boolean;
  setIsModelModalOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isLoading: boolean;
  isCloudSynced: boolean;
  refreshData: () => Promise<void>;
  upsertVideo: (video: Partial<VideoItem> & { model_id: string; title: string; planned_date: string }) => Promise<VideoItem>;
  deleteVideo: (id: string) => Promise<void>;
  upsertModel: (model: Omit<Model, 'id' | 'created_at'> & { id?: string }) => Promise<Model>;
  deleteModel: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Usuario actualmente autenticado
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('contentlab_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [users, setUsers] = useState<AppUser[]>([]);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  // Rol derivado del usuario actual (si no hay sesión, por defecto 'lector')
  const userRole: UserRole = currentUser?.role || 'lector';

  const [models, setModels] = useState<Model[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('modelos');

  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isCreateVideoOpen, setIsCreateVideoOpen] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('contentlab_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('contentlab_theme', theme);
  }, [theme]);

  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay credenciales configuradas
  const credentials = getStoredCredentials();
  const isCloudSynced = Boolean(credentials.url && credentials.anonKey && !credentials.url.includes('tu-proyecto'));

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [fetchedModels, fetchedVideos, fetchedUsers] = await Promise.all([
        getModels(),
        getVideos(),
        getAppUsers(),
      ]);
      setModels(fetchedModels);
      setVideos(fetchedVideos);
      setUsers(fetchedUsers);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Autenticación
  const login = async (username: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    let currentUsers = users;
    if (currentUsers.length === 0) {
      currentUsers = await getAppUsers();
      setUsers(currentUsers);
    }

    const cleanUser = username.trim().toLowerCase();
    const found = currentUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanUser ||
        (cleanUser.includes('@') && u.username.toLowerCase() === cleanUser.split('@')[0])
    );

    if (!found) {
      return { success: false, message: 'El usuario no existe.' };
    }

    if (found.password !== pass.trim()) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }

    setCurrentUser(found);
    setActiveTab('modelos');
    localStorage.setItem('contentlab_active_user', JSON.stringify(found));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveTab('modelos');
    localStorage.removeItem('contentlab_active_user');
    setIsSettingsOpen(false);
    setIsUsersModalOpen(false);
  };

  // Gestión de Usuarios (Exclusivo Administrador)
  const upsertUser = async (
    userData: Partial<AppUser> & { name: string; username: string; password: string; role: UserRole }
  ): Promise<AppUser> => {
    const saved = await saveAppUser(userData);
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });

    // Si el usuario editado es el mismo que está logueado, actualizar sesión
    if (currentUser?.id === saved.id) {
      setCurrentUser(saved);
      localStorage.setItem('contentlab_active_user', JSON.stringify(saved));
    }

    return saved;
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    if (currentUser?.id === id) {
      alert('No puedes eliminar tu propio usuario mientras tienes la sesión activa.');
      return false;
    }
    const success = await deleteAppUser(id);
    if (success) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
    return success;
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const upsertVideo = async (
    videoData: Partial<VideoItem> & { model_id: string; title: string; planned_date: string }
  ) => {
    const saved = await saveVideo(videoData);
    setVideos((prev) => {
      const idx = prev.findIndex((v) => v.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });
    return saved;
  };

  const deleteVideo = async (id: string) => {
    await removeVideo(id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
    if (activeVideo?.id === id) {
      setActiveVideo(null);
    }
  };

  const upsertModel = async (modelData: Omit<Model, 'id' | 'created_at'> & { id?: string }) => {
    const saved = await saveModel(modelData);
    setModels((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });
    return saved;
  };

  const deleteModel = async (id: string) => {
    await removeModel(id);
    setModels((prev) => prev.filter((m) => m.id !== id));
    setVideos((prev) => prev.filter((v) => v.model_id !== id));
    if (selectedModelId === id) {
      setSelectedModelId('all');
    }
  };

  // Filtrado reactivo de videos
  const filteredVideos = videos.filter((video) => {
    if (selectedModelId !== 'all' && video.model_id !== selectedModelId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = video.title.toLowerCase().includes(q);
      const matchNotes = (video.notes || '').toLowerCase().includes(q);
      const model = models.find((m) => m.id === video.model_id);
      const matchModel = model ? model.name.toLowerCase().includes(q) : false;
      return matchTitle || matchNotes || matchModel;
    }
    return true;
  });

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        userRole,
        login,
        logout,
        upsertUser,
        deleteUser,
        isUsersModalOpen,
        setIsUsersModalOpen,
        models,
        videos,
        filteredVideos,
        selectedModelId,
        setSelectedModelId,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        activeVideo,
        setActiveVideo,
        isCreateVideoOpen,
        setIsCreateVideoOpen,
        preselectedDate,
        setPreselectedDate,
        activeModel,
        setActiveModel,
        isModelModalOpen,
        setIsModelModalOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        theme,
        toggleTheme,
        isLoading,
        isCloudSynced,
        refreshData,
        upsertVideo,
        deleteVideo,
        upsertModel,
        deleteModel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
