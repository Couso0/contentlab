import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Model, VideoItem, AppUser, UserRole } from '../types';
import { INITIAL_MODELS, INITIAL_VIDEOS } from './mockData';

// Claves de almacenamiento local para persistencia y configuración dinámica
const CONFIG_KEY_URL = 'studio_planner_supabase_url';
const CONFIG_KEY_ANON = 'studio_planner_supabase_anon';
const STORAGE_MODELS_KEY = 'studio_planner_models_cache';
const STORAGE_VIDEOS_KEY = 'studio_planner_videos_cache';
const STORAGE_USERS_KEY = 'contentlab_users_cache';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'u1',
    name: 'Administrador Principal',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'u2',
    name: 'Lector General',
    username: 'lector',
    password: 'lector123',
    role: 'lector',
    created_at: '2026-09-01T00:00:00Z',
  },
];

// Obtener credenciales actuales (de .env o de localStorage)
export const getStoredCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(CONFIG_KEY_URL) || '';
  const localKey = localStorage.getItem(CONFIG_KEY_ANON) || '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey,
    isCustom: Boolean(localUrl && localKey),
  };
};

// Crear cliente de Supabase dinámicamente
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getStoredCredentials();
  if (!url || !anonKey || url.includes('tu-proyecto') || anonKey.includes('tu-anon-key')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey);
    } catch (e) {
      console.warn('Error al inicializar cliente de Supabase:', e);
      return null;
    }
  }
  return supabaseInstance;
};

// Guardar nuevas credenciales
export const saveSupabaseCredentials = (url: string, key: string) => {
  localStorage.setItem(CONFIG_KEY_URL, url.trim());
  localStorage.setItem(CONFIG_KEY_ANON, key.trim());
  supabaseInstance = null; // Reiniciar instancia
};

// Limpiar credenciales
export const clearSupabaseCredentials = () => {
  localStorage.removeItem(CONFIG_KEY_URL);
  localStorage.removeItem(CONFIG_KEY_ANON);
  supabaseInstance = null;
};

// Probar conexión con Supabase
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Faltan configurar la URL y la Anon Key de Supabase.' };
  }

  try {
    const { error } = await client.from('models').select('id').limit(1);
    if (error) {
      return { success: false, message: `Error en la base de datos: ${error.message}. Asegúrate de haber ejecutado el script SQL.` };
    }
    return { success: true, message: '¡Conexión exitosa a Supabase y tablas encontradas!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error desconocido al conectar con Supabase.' };
  }
};

// =========================================================================
// SERVICIOS DE MODELOS
// =========================================================================

export const getModels = async (): Promise<Model[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('models').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        localStorage.setItem(STORAGE_MODELS_KEY, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Supabase fetch models falló, usando caché local', err);
    }
  }

  // Fallback a localStorage / Mock
  const cached = localStorage.getItem(STORAGE_MODELS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Ignorar error de parseo
    }
  }
  localStorage.setItem(STORAGE_MODELS_KEY, JSON.stringify(INITIAL_MODELS));
  return INITIAL_MODELS;
};

export const saveModel = async (model: Omit<Model, 'id' | 'created_at'> & { id?: string }): Promise<Model> => {
  const client = getSupabaseClient();
  const id = model.id || crypto.randomUUID();
  const fullModel: Model = {
    ...model,
    id,
    created_at: new Date().toISOString(),
  };

  if (client) {
    try {
      const { data, error } = await client
        .from('models')
        .upsert({
          id: fullModel.id,
          name: fullModel.name,
          handle: fullModel.handle,
          platform: fullModel.platform,
          avatar_url: fullModel.avatar_url,
          notes: fullModel.notes,
        })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Error al guardar modelo en Supabase:', err);
    }
  }

  // Fallback local
  const current = await getModels();
  const index = current.findIndex((m) => m.id === id);
  let updated: Model[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = fullModel;
  } else {
    updated = [...current, fullModel];
  }
  localStorage.setItem(STORAGE_MODELS_KEY, JSON.stringify(updated));
  return fullModel;
};

export const deleteModel = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('models').delete().eq('id', id);
    } catch (err) {
      console.warn('Error eliminando modelo en Supabase', err);
    }
  }

  const current = await getModels();
  const updated = current.filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_MODELS_KEY, JSON.stringify(updated));

  // Limpiar también los videos asociados a este modelo en la caché local
  const cachedVideos = localStorage.getItem(STORAGE_VIDEOS_KEY);
  if (cachedVideos) {
    try {
      const parsed: VideoItem[] = JSON.parse(cachedVideos);
      const cleanVideos = parsed.filter((v) => v.model_id !== id);
      localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(cleanVideos));
    } catch {
      // Ignorar error de parseo
    }
  }

  return true;
};

// =========================================================================
// SERVICIOS DE VIDEOS
// =========================================================================

export const getVideos = async (): Promise<VideoItem[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('videos')
        .select('*')
        .order('planned_date', { ascending: true });

      if (!error && data) {
        localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Supabase fetch videos falló, usando datos locales', err);
    }
  }

  // Fallback a localStorage / Mock
  const cached = localStorage.getItem(STORAGE_VIDEOS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Ignorar error
    }
  }
  localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(INITIAL_VIDEOS));
  return INITIAL_VIDEOS;
};

export const saveVideo = async (video: Partial<VideoItem> & { model_id: string; title: string; planned_date: string }): Promise<VideoItem> => {
  const client = getSupabaseClient();
  const id = video.id || crypto.randomUUID();
  const fullVideo: VideoItem = {
    id,
    model_id: video.model_id,
    title: video.title,
    reference_url: video.reference_url || '',
    video_url: video.video_url || '',
    status: video.status || 'Idea / Inspo',
    planned_date: video.planned_date,
    platforms: video.platforms || ['Instagram'],
    notes: video.notes || '',
    created_at: video.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (client) {
    try {
      const { data, error } = await client
        .from('videos')
        .upsert({
          id: fullVideo.id,
          model_id: fullVideo.model_id,
          title: fullVideo.title,
          reference_url: fullVideo.reference_url,
          video_url: fullVideo.video_url,
          status: fullVideo.status,
          planned_date: fullVideo.planned_date,
          platforms: fullVideo.platforms,
          notes: fullVideo.notes,
          updated_at: fullVideo.updated_at,
        })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Error al guardar video en Supabase:', err);
    }
  }

  // Fallback local
  const current = await getVideos();
  const index = current.findIndex((v) => v.id === id);
  let updated: VideoItem[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = fullVideo;
  } else {
    updated = [...current, fullVideo];
  }
  localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(updated));
  return fullVideo;
};

export const deleteVideo = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('videos').delete().eq('id', id);
    } catch (err) {
      console.warn('Error eliminando video en Supabase', err);
    }
  }

  const current = await getVideos();
  const updated = current.filter((v) => v.id !== id);
  localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(updated));
  return true;
};

// =========================================================================
// SERVICIOS DE SUBIDA DE VIDEO (SUPABASE STORAGE)
// =========================================================================

export const uploadVideoToStorage = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string | null; error: string | null }> => {
  const client = getSupabaseClient();

  // Validación de tamaño (máx 50MB en el plan gratuito de Supabase)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      url: null,
      error: 'El archivo excede los 50MB (límite del plan gratuito de Supabase por archivo). Puedes comprimirlo o usar un video más corto.',
    };
  }

  if (client) {
    try {
      if (onProgress) onProgress(20);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `drafts/${fileName}`;

      const { data, error } = await client.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        return { url: null, error: error.message };
      }

      if (onProgress) onProgress(80);

      // Obtener URL pública
      const { data: publicUrlData } = client.storage
        .from('videos')
        .getPublicUrl(data.path);

      if (onProgress) onProgress(100);
      return { url: publicUrlData.publicUrl, error: null };
    } catch (err: any) {
      return { url: null, error: err?.message || 'Error al subir a Supabase Storage' };
    }
  }

  // Si no hay Supabase configurado, simular subida usando URL local (Blob URL)
  if (onProgress) {
    onProgress(30);
    await new Promise((r) => setTimeout(r, 400));
    onProgress(70);
    await new Promise((r) => setTimeout(r, 400));
    onProgress(100);
  }

  // Convertir a blob local para prueba inmediata
  const localUrl = URL.createObjectURL(file);
  return {
    url: localUrl,
    error: null,
  };
};

export const uploadAvatarToStorage = async (
  file: File
): Promise<{ url: string | null; error: string | null }> => {
  // Validación de tamaño (máx 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { url: null, error: 'La imagen excede el límite de 10MB.' };
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `avatars/${crypto.randomUUID()}.${ext}`;

      const { data, error } = await client.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = client.storage
          .from('videos')
          .getPublicUrl(data.path);
        return { url: publicUrlData.publicUrl, error: null };
      }
    } catch (err) {
      console.warn('Error subiendo avatar a Supabase Storage, convirtiendo a DataURL:', err);
    }
  }

  // Fallback: Convertir a Data URL (base64) permanente para persistencia local
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
    });
    return { url: base64, error: null };
  } catch (err: any) {
    return { url: null, error: err?.message || 'Error al procesar la imagen' };
  }
};

// =========================================================================
// SERVICIOS DE GESTIÓN DE USUARIOS (ADMINISTRADOR)
// =========================================================================

export const getAppUsers = async (): Promise<AppUser[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Error al obtener usuarios de Supabase, usando caché local', err);
    }
  }

  // Fallback a localStorage
  const cached = localStorage.getItem(STORAGE_USERS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Ignorar error de parseo
    }
  }
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
};

export const saveAppUser = async (
  user: Partial<AppUser> & { name: string; username: string; password: string; role: UserRole }
): Promise<AppUser> => {
  const client = getSupabaseClient();
  const id = user.id || crypto.randomUUID();
  const fullUser: AppUser = {
    id,
    name: user.name.trim(),
    username: user.username.trim(),
    password: user.password.trim(),
    role: user.role,
    created_at: user.created_at || new Date().toISOString(),
  };

  if (client) {
    try {
      const { data, error } = await client
        .from('app_users')
        .upsert({
          id: fullUser.id,
          name: fullUser.name,
          username: fullUser.username,
          password: fullUser.password,
          role: fullUser.role,
        })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Error al guardar usuario en Supabase:', err);
    }
  }

  // Fallback local
  const current = await getAppUsers();
  const index = current.findIndex((u) => u.id === id);
  let updated: AppUser[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = fullUser;
  } else {
    updated = [...current, fullUser];
  }
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
  return fullUser;
};

export const deleteAppUser = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('app_users').delete().eq('id', id);
    } catch (err) {
      console.warn('Error eliminando usuario en Supabase', err);
    }
  }

  const current = await getAppUsers();
  const updated = current.filter((u) => u.id !== id);
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
  return true;
};
