import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, Check, Smartphone, Globe, Plus } from 'lucide-react';
import type { ModelAccount } from '../../types';

export const AccountDropdown: React.FC = () => {
  const {
    models,
    selectedModelId,
    selectedAccountId,
    setSelectedAccountId,
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

  if (selectedModelId === 'all') {
    return null;
  }

  const selectedModel = models.find((m) => m.id === selectedModelId);
  if (!selectedModel) return null;

  const accounts: ModelAccount[] = selectedModel.accounts || [];
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const modelVideos = videos.filter((v) => v.model_id === selectedModel.id);

  const handleSelect = (id: string | 'all') => {
    setSelectedAccountId(id);
    setIsOpen(false);
  };

  return (
    <div className="custom-dropdown-container account-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-dropdown-trigger account-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Filtrar por cuenta de la modelo"
      >
        <div className="trigger-model-content">
          {selectedAccount ? (
            <>
              <div
                className="account-trigger-icon"
                style={{
                  background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
                  color: '#e879f9',
                }}
              >
                <Smartphone size={13} />
              </div>
              <span className="trigger-name">{selectedAccount.handle || selectedAccount.name}</span>
              <span className="trigger-platform-tag">{selectedAccount.platform}</span>
              {selectedAccount.name && (
                <span className="account-tag-pill">{selectedAccount.name}</span>
              )}
            </>
          ) : (
            <>
              <div className="account-trigger-icon all-accounts">
                <Globe size={13} />
              </div>
              <span className="trigger-name">Todas las Cuentas</span>
              <span className="account-count-badge">{accounts.length}</span>
            </>
          )}
        </div>

        <ChevronDown
          size={14}
          className={`dropdown-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <div className="custom-dropdown-menu account-dropdown-menu" role="listbox">
          <div className="dropdown-menu-header">
            <span>Cuentas de {selectedModel.name}</span>
          </div>

          {/* Opción: Todas las Cuentas */}
          <div
            className={`dropdown-item ${selectedAccountId === 'all' ? 'selected' : ''}`}
            onClick={() => handleSelect('all')}
            role="option"
            aria-selected={selectedAccountId === 'all'}
          >
            <div className="item-icon-box" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Globe size={15} />
            </div>
            <div className="item-details">
              <span className="item-title">Todas las cuentas</span>
              <span className="item-subtitle">
                {modelVideos.length} {modelVideos.length === 1 ? 'video total' : 'videos totales'}
              </span>
            </div>
            {selectedAccountId === 'all' && <Check size={16} className="item-check" />}
          </div>

          <div className="dropdown-divider" />

          {/* Lista de cuentas de la modelo */}
          <div className="dropdown-list-scroll">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              const accountVideosCount = modelVideos.filter((v) => v.account_id === acc.id).length;

              return (
                <div
                  key={acc.id}
                  className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(acc.id)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div
                    className="item-icon-box"
                    style={{
                      background: 'rgba(217, 70, 239, 0.15)',
                      color: '#e879f9',
                    }}
                  >
                    <Smartphone size={15} />
                  </div>

                  <div className="item-details">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="item-title">{acc.handle || acc.name}</span>
                      <span className="item-platform-badge">{acc.platform}</span>
                      {acc.is_primary && (
                        <span className="account-primary-pill" title="Cuenta principal">
                          ⭐ Principal
                        </span>
                      )}
                    </div>
                    <span className="item-subtitle">
                      {acc.name ? `${acc.name} • ` : ''}{accountVideosCount} {accountVideosCount === 1 ? 'video' : 'videos'}
                    </span>
                  </div>

                  {isSelected && <Check size={16} className="item-check" />}
                </div>
              );
            })}
          </div>

          {/* Si el usuario es Administrador: Enlace directo para gestionar cuentas de la modelo */}
          {userRole === 'admin' && (
            <>
              <div className="dropdown-divider" />
              <div
                className="dropdown-item"
                style={{ cursor: 'pointer', color: 'var(--primary)' }}
                onClick={() => {
                  setIsOpen(false);
                  setActiveModel(selectedModel);
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
                  <Plus size={15} />
                </div>
                <div className="item-details">
                  <span className="item-title" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    + Gestionar / Agregar Cuentas
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
