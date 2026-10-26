import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, Check, Users, Plus } from 'lucide-react';

export const ModelDropdown: React.FC = () => {
  const {
    models,
    selectedModelId,
    setSelectedModelId,
    videos,
    userRole,
    setActiveModel,
    setIsModelModalOpen,
  } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  const handleSelect = (id: string | 'all') => {
    setSelectedModelId(id);
    setIsOpen(false);
  };

  const validVideosCount = videos.filter((v) => models.some((m) => m.id === v.model_id)).length;

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      {/* Botón Disparador */}
      <button
        type="button"
        className={`custom-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedModel ? (
          <div className="trigger-model-content">
            <img
              src={selectedModel.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={selectedModel.name}
              className="trigger-avatar"
            />
            <span className="trigger-name">{selectedModel.name}</span>
            <span className="trigger-platform-tag">{selectedModel.platform || 'Instagram'}</span>
          </div>
        ) : (
          <div className="trigger-model-content">
            <div className="trigger-icon-circle">
              <Users size={14} />
            </div>
            <span className="trigger-name">Todas las Modelos</span>
          </div>
        )}

        <ChevronDown
          size={15}
          className={`dropdown-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <div className="custom-dropdown-menu" role="listbox">
          <div className="dropdown-menu-header">
            <span>Filtrar por Creadora</span>
          </div>

          {/* Opción: Todas las Modelos */}
          <div
            className={`dropdown-item ${selectedModelId === 'all' ? 'selected' : ''}`}
            onClick={() => handleSelect('all')}
            role="option"
            aria-selected={selectedModelId === 'all'}
          >
            <div className="item-icon-box">
              <Users size={16} />
            </div>
            <div className="item-details">
              <span className="item-title">Todas las Modelos</span>
              <span className="item-subtitle">
                {validVideosCount} {validVideosCount === 1 ? 'video total' : 'videos totales'}
              </span>
            </div>
            {selectedModelId === 'all' && <Check size={16} className="item-check" />}
          </div>

          <div className="dropdown-divider" />

          {/* Lista de Modelos */}
          <div className="dropdown-list-scroll">
            {models.map((model) => {
              const modelVideosCount = videos.filter((v) => v.model_id === model.id).length;
              const isSelected = selectedModelId === model.id;

              return (
                <div
                  key={model.id}
                  className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(model.id)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <img
                    src={model.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={model.name}
                    className="item-avatar"
                  />
                  <div className="item-details">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="item-title">{model.name}</span>
                      <span className="item-platform-badge">{model.platform || 'Instagram'}</span>
                    </div>
                    <span className="item-subtitle">
                      {model.accounts && model.accounts.length > 1 ? `${model.accounts.length} cuentas` : model.handle || '@creadora'} • {modelVideosCount} {modelVideosCount === 1 ? 'video' : 'videos'}
                    </span>
                  </div>
                  {isSelected && <Check size={16} className="item-check" />}
                </div>
              );
            })}
          </div>

          {/* Acción para Administrador: Agregar Nueva Creadora */}
          {userRole === 'admin' && (
            <>
              <div className="dropdown-divider" />
              <div
                className="dropdown-item"
                style={{ cursor: 'pointer', color: 'var(--primary)' }}
                onClick={() => {
                  setIsOpen(false);
                  setActiveModel(null);
                  setIsModelModalOpen(true);
                }}
              >
                <div
                  className="item-icon-box"
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: 'var(--primary)',
                  }}
                >
                  <Plus size={16} strokeWidth={2.4} />
                </div>
                <div className="item-details">
                  <span className="item-title" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    + Agregar Creadora
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
