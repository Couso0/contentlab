import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit2, Calendar, Sparkles, Play } from 'lucide-react';

export const ModelsView: React.FC = () => {
  const {
    models,
    videos,
    selectedModelId,
    setSelectedModelId,
    setActiveVideo,
    setIsCreateVideoOpen,
    setPreselectedDate,
    setActiveModel,
    setIsModelModalOpen,
    userRole,
  } = useApp();

  // Filtrar modelos según selección del header
  const displayedModels = models.filter((m) =>
    selectedModelId === 'all' ? true : m.id === selectedModelId
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Idea / Inspo':
        return '#f59e0b';
      case 'Por Grabar':
        return '#0ea5e9';
      case 'En Edición':
        return '#a855f7';
      case 'Listo':
        return '#10b981';
      case 'Publicado':
        return '#ec4899';
      default:
        return 'var(--primary)';
    }
  };

  const handleAddVideoForModel = (modelId: string) => {
    setSelectedModelId(modelId);
    const today = new Date().toISOString().split('T')[0];
    setPreselectedDate(today);
    setIsCreateVideoOpen(true);
  };

  return (
    <div style={{ padding: '0 28px 40px' }}>
      {/* Barra de cabecera de la sección de modelos */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Secciones por Modelo
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Gestiona la programación mensual de contenido agrupada por cada creadora.
          </p>
        </div>

        {userRole === 'admin' && (
          <button
            className="btn-primary-gradient"
            onClick={() => {
              setActiveModel(null);
              setIsModelModalOpen(true);
            }}
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Agregar Creadora</span>
          </button>
        )}
      </div>

      {/* Contenedor de Creadoras */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {displayedModels.map((model) => {
          const modelVideos = videos.filter((v) => v.model_id === model.id);

          return (
            <div
              key={model.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {/* Header de la Modelo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: userRole === 'admin' ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (userRole === 'admin') {
                      setActiveModel(model);
                      setIsModelModalOpen(true);
                    }
                  }}
                  title={userRole === 'admin' ? 'Haz clic para editar nombre y foto de perfil' : undefined}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={model.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={model.name}
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--primary)',
                        boxShadow: '0 0 12px rgba(139, 92, 246, 0.3)',
                        display: 'block',
                      }}
                    />
                    {userRole === 'admin' && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          background: 'var(--primary)',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        }}
                      >
                        <Edit2 size={10} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {model.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: 'rgba(217, 70, 239, 0.15)',
                          color: '#e879f9',
                          border: '1px solid rgba(217, 70, 239, 0.3)',
                          fontWeight: 600,
                        }}
                      >
                        {model.platform || 'Instagram'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {model.handle || '@creadora'} • {modelVideos.length} {modelVideos.length === 1 ? 'video programado' : 'videos programados'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {userRole === 'admin' && (
                    <button
                      className="icon-btn"
                      onClick={() => {
                        setActiveModel(model);
                        setIsModelModalOpen(true);
                      }}
                      title="Editar nombre, foto o datos de la creadora"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                  {userRole === 'admin' && (
                    <button
                      className="btn-secondary"
                      onClick={() => handleAddVideoForModel(model.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={15} />
                      <span>Nuevo Video</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid de Videos de esta Modelo */}
              {modelVideos.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {modelVideos.map((video) => {
                    const statusColor = getStatusColor(video.status);

                    return (
                      <div
                        key={video.id}
                        onClick={() => setActiveVideo(video)}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        {/* Mini preview / Player thumbnail */}
                        <div
                          style={{
                            height: '110px',
                            backgroundColor: '#050811',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          {video.video_url ? (
                            <video
                              src={video.video_url}
                              preload="metadata"
                              muted
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Film size={26} color="var(--text-muted)" />
                          )}

                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0, 0, 0, 0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0.8,
                            }}
                          >
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'rgba(139, 92, 246, 0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                              }}
                            >
                              <Play size={14} fill="currentColor" />
                            </div>
                          </div>

                          {/* Badge de fecha */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '6px',
                              left: '6px',
                              background: 'rgba(0, 0, 0, 0.7)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Calendar size={11} />
                            <span>{video.planned_date}</span>
                          </div>
                        </div>

                        {/* Título y estado */}
                        <div>
                          <h4
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {video.title}
                          </h4>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginTop: '6px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: statusColor,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: statusColor,
                                }}
                              />
                              {video.status}
                            </span>

                            <div style={{ display: 'flex', gap: '4px' }}>
                              {video.platforms.map((p) => (
                                <span
                                  key={p}
                                  style={{
                                    fontSize: '0.62rem',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {p.slice(0, 2)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: '28px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-subtle)',
                  }}
                >
                  <Sparkles size={24} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    No hay videos planificados para {model.name} todavía.
                  </p>
                  {userRole === 'admin' && (
                    <button
                      className="btn-secondary"
                      style={{ marginTop: '12px', fontSize: '0.78rem' }}
                      onClick={() => handleAddVideoForModel(model.id)}
                    >
                      + Programar Primer Video
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Film = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </svg>
);
