import React from 'react';
import { useApp } from '../../context/AppContext';
import { Video, Sun, Moon, Database, Plus, LogOut, Users } from 'lucide-react';
import { ModelDropdown } from './ModelDropdown';

export const Header: React.FC = () => {
  const {
    currentUser,
    userRole,
    logout,
    theme,
    toggleTheme,
    setIsSettingsOpen,
    setIsUsersModalOpen,
    setIsCreateVideoOpen,
    setPreselectedDate,
  } = useApp();

  const handleOpenNewVideo = () => {
    const today = new Date().toISOString().split('T')[0];
    setPreselectedDate(today);
    setIsCreateVideoOpen(true);
  };

  return (
    <header className="app-header">
      {/* Brand / Logo */}
      <div className="brand-section">
        <div className="brand-logo">
          <Video size={20} strokeWidth={2.4} />
        </div>
        <div className="brand-info">
          <h1>ContentLab</h1>
        </div>
      </div>

      {/* Selector de Modelos Central Personalizado */}
      <div className="header-center">
        <ModelDropdown />
      </div>

      {/* Acciones Derecha */}
      <div className="header-actions">
        {/* Botón de Nuevo Video (exclusivo para Administrador) */}
        {userRole === 'admin' && (
          <button
            className="btn-primary-gradient"
            onClick={handleOpenNewVideo}
            title="Crear nueva planificación de video"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Nuevo Video</span>
          </button>
        )}

        {/* Badge de Usuario Actual y Rol */}
        <div
          className={`role-badge ${userRole === 'admin' ? 'admin' : ''}`}
          title={`Conectado como: ${currentUser?.username || ''} (${userRole})`}
        >
          <span className="role-dot"></span>
          <span>{currentUser?.name || (userRole === 'admin' ? 'Administrador' : 'Lector')}</span>
        </div>

        {/* Gestión de Usuarios y Roles: SOLAMENTE VISIBLE PARA EL ADMINISTRADOR */}
        {userRole === 'admin' && (
          <button
            className="icon-btn"
            onClick={() => setIsUsersModalOpen(true)}
            title="Gestión de Usuarios y Roles (Solo Administrador)"
          >
            <Users size={17} />
          </button>
        )}

        {/* Configuración de Supabase: SOLAMENTE VISIBLE PARA EL ADMINISTRADOR */}
        {userRole === 'admin' && (
          <button
            className="icon-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="Configuración de Base de Datos (Solo Administrador)"
          >
            <Database size={17} />
          </button>
        )}

        {/* Cerrar Sesión (vuelve a la pantalla de login) */}
        <button
          className="icon-btn"
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>

        {/* Alternar Tema */}
        <button className="icon-btn" onClick={toggleTheme} title="Cambiar tema claro / oscuro">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
};
