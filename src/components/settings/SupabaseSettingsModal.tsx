import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getStoredCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
} from '../../lib/supabase';
import { Database, X, Check, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({ isOpen, onClose }) => {
  const { refreshData } = useApp();
  const current = getStoredCredentials();

  const [url, setUrl] = useState(current.url || '');
  const [anonKey, setAnonKey] = useState(current.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ success?: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setStatusMsg({
        success: false,
        message: 'Por favor ingresa la URL y la Anon Key de tu proyecto en Supabase.',
      });
      return;
    }

    setTesting(true);
    setStatusMsg(null);
    saveSupabaseCredentials(url, anonKey);

    const res = await testSupabaseConnection();
    setTesting(false);
    setStatusMsg(res);

    if (res.success) {
      await refreshData();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(url, anonKey);
    await refreshData();
    onClose();
  };

  const handleClear = async () => {
    if (confirm('¿Deseas desconectar Supabase y volver al modo local?')) {
      clearSupabaseCredentials();
      setUrl('');
      setAnonKey('');
      setStatusMsg(null);
      await refreshData();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <div
            className="modal-title"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
            }}
          >
            <Database size={18} />
            <span>Configuración de Base de Datos (Supabase)</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Conecta tu cuenta gratuita de <strong>Supabase</strong> para sincronizar modelos, videos y subir archivos a <strong>Supabase Storage</strong> sin coste.
          </p>

          <div className="form-group">
            <label className="form-label">Project URL de Supabase</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anon / Public API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
          </div>

          {/* Estado de conexión */}
          {statusMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: statusMsg.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${statusMsg.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                color: statusMsg.success ? '#34d399' : '#f87171',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {statusMsg.success ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{statusMsg.message}</span>
            </div>
          )}

          {/* Guía rápida de SQL */}
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#f1f5f9' }}>📌 Script SQL generado:</span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                  fontSize: '0.72rem',
                }}
              >
                <span>Ir a Supabase</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <p style={{ marginTop: '4px', lineHeight: 1.4 }}>
              Tienes el archivo <code>supabase/schema.sql</code> listo en tu proyecto con las tablas de <code>models</code>, <code>videos</code> y el bucket de Storage <code>videos</code> configurado.
            </p>
          </div>

          <div
            className="modal-footer"
            style={{
              margin: '0 -24px -22px',
              borderBottomLeftRadius: 'var(--radius-lg)',
              borderBottomRightRadius: 'var(--radius-lg)',
            }}
          >
            {current.isCustom && (
              <button type="button" className="btn-danger" onClick={handleClear}>
                Desconectar
              </button>
            )}

            <button
              type="button"
              className="btn-secondary"
              onClick={handleTestConnection}
              disabled={testing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
              <span>{testing ? 'Verificando...' : 'Probar Conexión'}</span>
            </button>

            <button type="submit" className="btn-primary-gradient">
              <Check size={16} />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
