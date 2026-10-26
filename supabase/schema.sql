-- ==============================================================================
-- CONTENTLAB: SUPABASE DATABASE & STORAGE SCHEMA
-- ==============================================================================
-- Instrucciones:
-- 1. Ve a tu proyecto en Supabase (https://supabase.com).
-- 2. Entra en "SQL Editor" en el menú lateral.
-- 3. Pega este script completo y haz clic en "Run".
-- ==============================================================================

-- 1. Crear extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Usuarios del Sistema (Administradores y Lectores)
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'lector', -- 'admin' o 'lector'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabla de Modelos / Creadoras (con soporte para múltiples cuentas)
CREATE TABLE IF NOT EXISTS public.models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    handle TEXT,
    platform TEXT DEFAULT 'Instagram',
    avatar_url TEXT,
    notes TEXT,
    accounts JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Si la tabla ya existía, asegurarse de tener la columna accounts:
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS accounts JSONB DEFAULT '[]'::jsonb;

-- 4. Tabla de Videos / Contenido (vinculada a cuenta opcional de la modelo)
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES public.models(id) ON DELETE CASCADE,
    account_id TEXT,
    title TEXT NOT NULL,
    reference_url TEXT,
    video_url TEXT,
    status TEXT DEFAULT 'Idea / Inspo' NOT NULL,
    planned_date DATE NOT NULL,
    platforms TEXT[] DEFAULT ARRAY['Instagram']::TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Si la tabla ya existía, asegurarse de tener la columna account_id:
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS account_id TEXT;

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de acceso público/anónimo
CREATE POLICY "Permitir todo en usuarios" 
ON public.app_users FOR ALL USING (true);

CREATE POLICY "Permitir todo en modelos" 
ON public.models FOR ALL USING (true);

CREATE POLICY "Permitir todo en videos" 
ON public.videos FOR ALL USING (true);

-- 7. Crear Bucket de Almacenamiento para Videos ("videos")
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Políticas para el bucket de almacenamiento
CREATE POLICY "Permitir subida publica de videos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Permitir lectura publica de videos almacenados" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Permitir borrado publico de videos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'videos');

-- 9. Datos iniciales de usuarios por defecto
INSERT INTO public.app_users (name, username, password, role) VALUES
('Administrador Principal', 'admin', 'admin123', 'admin'),
('Lector General', 'lector', 'lector123', 'lector')
ON CONFLICT (username) DO NOTHING;

-- 10. Datos de prueba iniciales para Modelos
INSERT INTO public.models (name, handle, platform, avatar_url, notes) VALUES
('LILY VALDEZ', '@lilyvaldez', 'Instagram', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Modelo principal, contenido de trends y lifestyle'),
('SOFIA MORA', '@sofiamora', 'Instagram', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'Especialidad en reels de moda y estilo'),
('VALENTINA RIOS', '@valentinarios', 'TikTok', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', 'Enfoque en trends de TikTok y baile')
ON CONFLICT DO NOTHING;
