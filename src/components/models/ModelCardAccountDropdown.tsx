import React, { useState, useRef, useEffect } from 'react';
import type { Model, ModelAccount, VideoItem } from '../../types';
import { ChevronDown, Check, Smartphone, Globe, Plus } from 'lucide-react';

interface ModelCardAccountDropdownProps {
  model: Model;
  selectedAccountId: string | 'all';
  onSelectAccount: (accountId: string | 'all') => void;
  totalVideosCount: number;
  modelVideos: VideoItem[];
  onOpenManageAccounts?: () => void;
  userRole: string;
}

export const ModelCardAccountDropdown: React.FC<ModelCardAccountDropdownProps> = ({
  model,
  selectedAccountId,
  onSelectAccount,
  totalVideosCount,
  modelVideos,
  onOpenManageAccounts,
  userRole,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const accounts: ModelAccount[] = model.accounts || [];
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`card-account-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Seleccionar cuenta de la modelo para ver sus videos"
      >
        {selectedAccount ? (
          <>
            <div
              className="account-trigger-icon"
              style={{
                width: '18px',
                height: '18px',
                background: 'rgba(217, 70, 239, 0.2)',
                color: '#e879f9',
              }}
            >
              <Smartphone size={11} />
            </div>
            <span style={{ color: 'var(--text-primary)' }}>{selectedAccount.handle || selectedAccount.name}</span>
            <span className="trigger-platform-tag">{selectedAccount.platform}</span>
          </>
        ) : (
          <>
            <div
              className="account-trigger-icon"
              style={{
                width: '18px',
                height: '18px',
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
              }}
            >
              <Globe size={11} />
            </div>
            <span>Todas las Cuentas ({accounts.length})</span>
          </>
        )}

        <ChevronDown
          size={14}
          className={`dropdown-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="custom-dropdown-menu"
          role="listbox"
          style={{
            right: 0,
            left: 'auto',
            transform: 'none',
            minWidth: '260px',
          }}
        >
          <div className="dropdown-menu-header">
            <span>Cuentas de {model.name}</span>
          </div>

          {/* Todas las cuentas */}
          <div
            className={`dropdown-item ${selectedAccountId === 'all' ? 'selected' : ''}`}
            onClick={() => {
              onSelectAccount('all');
              setIsOpen(false);
            }}
            role="option"
            aria-selected={selectedAccountId === 'all'}
          >
            <div className="item-icon-box" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Globe size={15} />
            </div>
            <div className="item-details">
              <span className="item-title">Todas las cuentas</span>
              <span className="item-subtitle">
                {totalVideosCount} {totalVideosCount === 1 ? 'video total' : 'videos totales'}
              </span>
            </div>
            {selectedAccountId === 'all' && <Check size={16} className="item-check" />}
          </div>

          <div className="dropdown-divider" />

          {/* Cuentas individuales */}
          <div className="dropdown-list-scroll">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              const count = modelVideos.filter((v) => v.account_id === acc.id).length;

              return (
                <div
                  key={acc.id}
                  className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectAccount(acc.id);
                    setIsOpen(false);
                  }}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="item-title">{acc.handle || acc.name}</span>
                      <span className="item-platform-badge">{acc.platform}</span>
                      {acc.is_primary && (
                        <span className="account-primary-pill">
                          ⭐ Principal
                        </span>
                      )}
                    </div>
                    <span className="item-subtitle">
                      {acc.name ? `${acc.name} • ` : ''}{count} {count === 1 ? 'video' : 'videos'}
                    </span>
                  </div>
                  {isSelected && <Check size={16} className="item-check" />}
                </div>
              );
            })}
          </div>

          {userRole === 'admin' && onOpenManageAccounts && (
            <>
              <div className="dropdown-divider" />
              <div
                className="dropdown-item"
                style={{ cursor: 'pointer', color: 'var(--primary)' }}
                onClick={() => {
                  setIsOpen(false);
                  onOpenManageAccounts();
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
