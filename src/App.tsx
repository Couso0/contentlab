import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { SubHeader } from './components/layout/SubHeader';
import { CalendarView } from './components/calendar/CalendarView';
import { ModelsView } from './components/models/ModelsView';
import { VideoModal } from './components/video/VideoModal';
import { ModelModal } from './components/models/ModelModal';
import { SupabaseSettingsModal } from './components/settings/SupabaseSettingsModal';
import { LoginPage } from './components/auth/LoginPage';
import { UserManagementModal } from './components/users/UserManagementModal';

import './styles/theme.css';
import './styles/components.css';
import './styles/calendar.css';
import './styles/modal.css';

const MainApp: React.FC = () => {
  const {
    currentUser,
    activeTab,
    activeVideo,
    setActiveVideo,
    isCreateVideoOpen,
    setIsCreateVideoOpen,
    activeModel,
    isModelModalOpen,
    setIsModelModalOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isUsersModalOpen,
    setIsUsersModalOpen,
    userRole,
    theme,
  } = useApp();

  // Si no hay un usuario autenticado, mostrar la pantalla de Login completa
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="app-root" data-theme={theme}>
      {/* Barra Superior */}
      <Header />

      {/* Pestañas y Buscador (sin el banner de modo solo lectura) */}
      <SubHeader />

      {/* Vistas Principales */}
      <main className="main-content">
        {activeTab === 'calendario' ? <CalendarView /> : <ModelsView />}
      </main>

      {/* Modales Globales */}
      {/* Modal de Detalle de Video */}
      <VideoModal
        video={activeVideo}
        isOpen={Boolean(activeVideo)}
        onClose={() => setActiveVideo(null)}
      />

      {/* Modal de Crear Nuevo Video */}
      <VideoModal
        video={null}
        isOpen={isCreateVideoOpen}
        onClose={() => setIsCreateVideoOpen(false)}
        isNew
      />

      {/* Modal de Crear/Editar Modelo */}
      <ModelModal
        model={activeModel}
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />

      {/* Modales Exclusivos para Administrador */}
      {userRole === 'admin' && (
        <>
          <SupabaseSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />

          <UserManagementModal
            isOpen={isUsersModalOpen}
            onClose={() => setIsUsersModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
