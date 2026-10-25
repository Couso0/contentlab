# ContentLab 🎬

Planificador y gestor avanzado de contenidos para creadoras de contenido y agencias. Permite programar publicaciones por modelo en vistas mensual y por creadora, gestionar estados de producción, reproducir muestras y sincronizar en la nube con Supabase.

---

## ✨ Características Principales

- **Gestión por Creadora / Modelo**: Agrupa contenidos de forma organizada con métricas, plataformas y fotos de perfil.
- **Calendario Mensual Interactivo**: Visualización completa de contenidos por día, estado y plataforma con microchips interactivos.
- **Sistema de Roles y Autenticación**:
  - **Administrador**: Control total para crear, editar y eliminar creadoras, videos, usuarios y base de datos.
  - **Lector**: Modo solo lectura para revisar publicaciones, notas y reproducir/descargar borradores de video.
- **Gestor de Usuarios**: Panel integrado para crear cuentas, editar credenciales y asignar roles en tiempo real.
- **Integración con Supabase**: Base de datos Postgres en tiempo real y almacenamiento de videos en Supabase Storage (con modo local de respaldo).
- **Modo Oscuro & Modo Claro**: Interfaz moderna, estética glassmorphism y cambio de tema fluido.

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- npm o pnpm

### Instalación y Ejecución

```bash
# 1. Clonar repositorio
git clone <URL_DEL_REPOSITORIO>
cd ContentLab

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

---

## 🗄️ Base de Datos (Supabase)

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En el **SQL Editor** de Supabase, ejecuta el script localizado en:
   ```
   supabase/schema.sql
   ```
3. Conéctalo desde la app haciendo clic en el icono de **Base de Datos** en el Header (iniciando como Administrador), o definiendo en tu archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

---

## 👤 Cuentas por Defecto

- **Administrador**: `admin` / `admin123`
- **Lector**: `lector` / `lector123`
