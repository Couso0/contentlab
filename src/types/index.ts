export type Platform = 'TikTok' | 'Instagram' | 'YouTube Shorts' | 'Facebook Reels';

export type VideoStatus =
  | 'Idea / Inspo'
  | 'Por Grabar'
  | 'En Edición'
  | 'Listo'
  | 'Publicado';

export interface Model {
  id: string;
  name: string;
  handle: string;
  platform: string;
  avatar_url?: string;
  notes?: string;
  created_at?: string;
}

export interface VideoItem {
  id: string;
  model_id: string;
  title: string;
  reference_url?: string;
  video_url?: string;
  status: VideoStatus;
  planned_date: string; // Formato YYYY-MM-DD
  platforms: Platform[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'lector' | 'admin';
export type ActiveTab = 'calendario' | 'modelos';

export interface FilterState {
  modelId: string | 'all';
  searchQuery: string;
  statusFilter: string | 'all';
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  created_at?: string;
}

export interface CredentialPair {
  username: string;
  password: string;
}

export interface RoleCredentialsMap {
  admin: CredentialPair;
  lector: CredentialPair;
}
