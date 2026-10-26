import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { uploadAvatarToStorage } from '../../lib/supabase';
import type { Model, ModelAccount } from '../../types';
import { User, X, Check, Trash2, Camera, Upload, AlertCircle, Image as ImageIcon, Plus, Smartphone, Star } from 'lucide-react';

interface ModelModalProps {
  model: Model | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
];

const PLATFORM_OPTIONS = [
  'Instagram',
  'TikTok',
  'OnlyFans',
  'YouTube Shorts',
  'Facebook Reels',
  'X / Twitter',
  'Fansly',
  'Twitch',
];

export const ModelModal: React.FC<ModelModalProps> = ({ model, isOpen, onClose }) => {
  const { upsertModel, deleteModel, userRole } = useApp();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [accounts, setAccounts] = useState<ModelAccount[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (model) {
      setName(model.name);
      setAvatarUrl(model.avatar_url || '');
      setNotes(model.notes || '');
      const initialAccounts =
        model.accounts && model.accounts.length > 0
          ? model.accounts.map((a) => ({ ...a }))
          : [
              {
                id: `${model.id}_main`,
                name: 'Principal',
                handle: model.handle || '',
                platform: model.platform || 'Instagram',
                is_primary: true,
              },
            ];
      setAccounts(initialAccounts);
    } else {
      setName('');
      setAvatarUrl(DEFAULT_AVATARS[0]);
      setNotes('');
      setAccounts([
        {
          id: crypto.randomUUID(),
          name: 'Principal',
          handle: '',
          platform: 'Instagram',
          is_primary: true,
        },
      ]);
    }
    setShowDeleteConfirm(false);
    setErrorMsg(null);
  }, [model, isOpen]);

  if (!isOpen) return null;

  const handleAddAccount = () => {
    setAccounts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        handle: '',
        platform: 'Instagram',
        is_primary: prev.length === 0,
      },
    ]);
  };

  const handleUpdateAccount = (id: string, updates: Partial<ModelAccount>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  };

  const handleSetPrimaryAccount = (id: string) => {
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        is_primary: acc.id === id,
      }))
    );
  };

  const handleRemoveAccount = (id: string) => {
    if (accounts.length <= 1) {
      setErrorMsg('Cada modelo debe tener al menos una cuenta configurada.');
      return;
    }
    setAccounts((prev) => {
      const filtered = prev.filter((acc) => acc.id !== id);
      if (!filtered.some((acc) => acc.is_primary) && filtered.length > 0) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setErrorMsg(null);

    try {
      const res = await uploadAvatarToStorage(file);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.url) {
        setAvatarUrl(res.url);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al procesar la imagen');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('El nombre de la creadora es obligatorio.');
      return;
    }

    const primaryAcc = accounts.find((a) => a.is_primary) || accounts[0];
    const cleanAccounts = accounts.map((a, idx) => ({
      ...a,
      name: a.name.trim() || (a.is_primary ? 'Principal' : `Cuenta ${idx + 1}`),
      handle: a.handle.trim(),
      is_primary: primaryAcc ? a.id === primaryAcc.id : idx === 0,
    }));

    setIsSaving(true);
    try {
      await upsertModel({
        id: model?.id,
        name: name.trim().toUpperCase(),
        handle: primaryAcc?.handle.trim() || `@${name.trim().toLowerCase().replace(/\s+/g, '')}`,
        platform: primaryAcc?.platform || 'Instagram',
        avatar_url: avatarUrl.trim() || DEFAULT_AVATARS[0],
        notes: notes.trim(),
        accounts: cleanAccounts,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar la modelo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!model?.id) return;
    setIsSaving(true);
    try {
      await deleteModel(model.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al eliminar la modelo.');
      setIsSaving(false);
    }
  };

  const activeAvatar = avatarUrl || DEFAULT_AVATARS[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text' }}>
            <User size={18} />
            <span>{model ? 'Editar Creadora / Modelo' : 'Nueva Creadora / Modelo'}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '0.82rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sección de Foto de Perfil / Avatar Interactiva */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '16px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Círculo de Avatar con botón de cámara */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'relative',
                width: '82px',
                height: '82px',
                borderRadius: '50%',
                cursor: 'pointer',
                flexShrink: 0,
                border: '3px solid var(--primary)',
                boxShadow: '0 0 16px rgba(139, 92, 246, 0.35)',
                overflow: 'hidden',
              }}
              title="Haz clic para cambiar la foto"
            >
              <img
                src={activeAvatar}
                alt="Avatar"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  opacity: 0.9,
                  transition: 'opacity 0.2s',
                }}
              >
                <Camera size={20} />
                <span style={{ fontSize: '0.62rem', fontWeight: 600, marginTop: '2px' }}>
                  {isUploadingPhoto ? 'Subiendo...' : 'Cambiar'}
                </span>
              </div>
            </div>

            {/* Input oculto de archivo */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            {/* Opciones de carga de foto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Foto de Perfil
              </span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Sube una imagen desde tu dispositivo o ingresa un enlace web.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.76rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  disabled={isUploadingPhoto}
                >
                  <Upload size={14} />
                  <span>{isUploadingPhoto ? 'Cargando...' : 'Subir Imagen'}</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {DEFAULT_AVATARS.slice(0, 3).map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Preset"
                      onClick={() => setAvatarUrl(url)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        objectFit: 'cover',
                        border: avatarUrl === url ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                        opacity: avatarUrl === url ? 1 : 0.7,
                      }}
                      title="Seleccionar foto predeterminada"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Campo de URL de imagen alternativa */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ImageIcon size={14} />
              <span>Enlace / URL de la Foto (Opcional)</span>
            </label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          {/* Nombre de la Modelo */}
          <div className="form-group">
            <label className="form-label">
              Nombre Completo / Artístico <span className="req">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. LILY VALDEZ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Sección de Cuentas de la Modelo / Redes Sociales */}
          <div className="form-group" style={{ marginTop: '4px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div>
                <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={15} color="var(--primary)" />
                  <span>Cuentas de la Modelo / Redes Sociales</span>
                </label>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Configura todas las cuentas de la modelo (Instagram principal, backup, TikTok, OnlyFans, etc.) para seleccionarlas en los menús desplegables.
                </p>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddAccount}
                style={{
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={13} />
                <span>Agregar Cuenta</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    backgroundColor: acc.is_primary ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-surface)',
                    border: acc.is_primary ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    flexWrap: 'wrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Selector de Plataforma */}
                  <div style={{ width: '135px', flexShrink: 0 }}>
                    <select
                      className="form-select"
                      style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                      value={acc.platform}
                      onChange={(e) => handleUpdateAccount(acc.id, { platform: e.target.value })}
                    >
                      {PLATFORM_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Usuario / Handle */}
                  <div style={{ flex: '1 1 120px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      placeholder="@usuario"
                      value={acc.handle}
                      onChange={(e) => handleUpdateAccount(acc.id, { handle: e.target.value })}
                    />
                  </div>

                  {/* Alias / Nombre de cuenta */}
                  <div style={{ flex: '1 1 110px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      placeholder="Ej. Principal, VIP"
                      value={acc.name}
                      onChange={(e) => handleUpdateAccount(acc.id, { name: e.target.value })}
                    />
                  </div>

                  {/* Botón de Cuenta Principal */}
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryAccount(acc.id)}
                    title={acc.is_primary ? 'Cuenta principal activa' : 'Marcar como cuenta principal'}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: acc.is_primary ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                      backgroundColor: acc.is_primary ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      color: acc.is_primary ? '#fbbf24' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Star size={13} fill={acc.is_primary ? '#fbbf24' : 'none'} />
                    <span>{acc.is_primary ? 'Principal' : 'Fijar'}</span>
                  </button>

                  {/* Botón Eliminar Cuenta */}
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleRemoveAccount(acc.id)}
                      style={{ width: '28px', height: '28px', color: '#f87171' }}
                      title="Eliminar esta cuenta"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="form-group">
            <label className="form-label">Notas o Directrices de la Modelo</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Estilo de contenido, nicho, preferencias de grabación, vestuario..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Modal Footer con confirmación de eliminación segura */}
          <div
            className="modal-footer"
            style={{
              margin: '0 -24px -22px',
              borderBottomLeftRadius: 'var(--radius-lg)',
              borderBottomRightRadius: 'var(--radius-lg)',
              flexDirection: showDeleteConfirm ? 'column' : 'row',
              alignItems: showDeleteConfirm ? 'stretch' : 'center',
            }}
          >
            {showDeleteConfirm ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%',
                  padding: '4px',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: 600, textAlign: 'center' }}>
                  ¿Estás seguro de eliminar a {name || 'esta creadora'}? Se eliminarán todos sus videos asociados.
                </span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={handleConfirmDelete}
                    disabled={isSaving}
                    style={{ margin: 0 }}
                  >
                    <Trash2 size={15} />
                    <span>{isSaving ? 'Eliminando...' : 'Sí, Eliminar Creadora'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {model?.id && userRole === 'admin' && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={15} />
                    <span>Eliminar</span>
                  </button>
                )}

                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancelar
                </button>

                <button type="submit" className="btn-primary-gradient" disabled={isSaving || isUploadingPhoto}>
                  <Check size={16} />
                  <span>{isSaving ? 'Guardando...' : model ? 'Guardar Cambios' : 'Crear Creadora'}</span>
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
