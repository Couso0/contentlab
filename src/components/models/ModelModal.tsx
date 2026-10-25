import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Model } from '../../types';
import { User, X, Check, Trash2 } from 'lucide-react';

interface ModelModalProps {
  model: Model | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModelModal: React.FC<ModelModalProps> = ({ model, isOpen, onClose }) => {
  const { upsertModel, deleteModel, userRole } = useApp();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (model) {
      setName(model.name);
      setHandle(model.handle || '');
      setPlatform(model.platform || 'Instagram');
      setAvatarUrl(model.avatar_url || '');
      setNotes(model.notes || '');
    } else {
      setName('');
      setHandle('');
      setPlatform('Instagram');
      setAvatarUrl('');
      setNotes('');
    }
  }, [model, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await upsertModel({
        id: model?.id,
        name: name.trim().toUpperCase(),
        handle: handle.trim(),
        platform,
        avatar_url:
          avatarUrl.trim() ||
          `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Error guardando modelo:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!model?.id) return;
    if (confirm(`¿Estás seguro de que deseas eliminar a ${model.name}? Se desvincularán sus videos.`)) {
      await deleteModel(model.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Usuario / Handle</label>
              <input
                type="text"
                className="form-input"
                placeholder="@usuario"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Plataforma Principal</label>
              <select
                className="form-select"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube Shorts">YouTube Shorts</option>
                <option value="Facebook Reels">Facebook</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">URL de Foto de Perfil / Avatar</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notas o Directrices de la Modelo</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Estilo de contenido, nicho, preferencias de grabación..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '0 -24px -22px', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
            {model?.id && userRole === 'admin' && (
              <button type="button" className="btn-danger" onClick={handleDelete}>
                <Trash2 size={15} />
                <span>Eliminar</span>
              </button>
            )}

            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="btn-primary-gradient" disabled={isSaving}>
              <Check size={16} />
              <span>{isSaving ? 'Guardando...' : 'Guardar Modelo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
