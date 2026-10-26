import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { VideoItem, Platform, VideoStatus } from '../../types';
import { uploadVideoToStorage } from '../../lib/supabase';
import {
  Sparkles,
  X,
  Link as LinkIcon,
  Download,
  Play,
  Upload,
  Trash2,
  ExternalLink,
  Check,
  Film,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const ALL_PLATFORMS: Platform[] = ['TikTok', 'Instagram', 'YouTube Shorts', 'Facebook Reels'];

const ALL_STATUSES: VideoStatus[] = [
  'Idea / Inspo',
  'Por Grabar',
  'En Edición',
  'Listo',
  'Publicado',
];

interface VideoModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  isNew?: boolean;
}

export const VideoModal: React.FC<VideoModalProps> = ({ video, isOpen, onClose, isNew = false }) => {
  const {
    models,
    userRole,
    upsertVideo,
    deleteVideo,
    preselectedDate,
    preselectedAccountId,
    selectedModelId,
  } = useApp();

  const [modelId, setModelId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [title, setTitle] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState<VideoStatus>('Idea / Inspo');
  const [plannedDate, setPlannedDate] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>(['Instagram']);
  const [notes, setNotes] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (video) {
      setModelId(video.model_id);
      setAccountId(video.account_id || '');
      setTitle(video.title);
      setReferenceUrl(video.reference_url || '');
      setVideoUrl(video.video_url || '');
      setStatus(video.status);
      setPlannedDate(video.planned_date);
      setPlatforms(video.platforms && video.platforms.length > 0 ? video.platforms : ['Instagram']);
      setNotes(video.notes || '');
    } else {
      // Valores por defecto al crear uno nuevo
      const defaultModelId = (selectedModelId !== 'all' ? selectedModelId : models[0]?.id) || '';
      const targetModel = models.find((m) => m.id === defaultModelId);
      const defaultAccId = preselectedAccountId || targetModel?.accounts?.[0]?.id || '';
      setModelId(defaultModelId);
      setAccountId(defaultAccId);
      setTitle('');
      setReferenceUrl('');
      setVideoUrl('');
      setStatus('Idea / Inspo');
      setPlannedDate(preselectedDate || new Date().toISOString().split('T')[0]);
      setPlatforms(['Instagram']);
      setNotes('');
    }
    setUploadError(null);
    setUploadPercent(0);
  }, [video, isOpen, models, preselectedDate, preselectedAccountId, selectedModelId]);

  if (!isOpen) return null;

  const isReadOnly = userRole === 'lector';

  const togglePlatform = (p: Platform) => {
    if (isReadOnly) return;
    setPlatforms((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((item) => item !== p) : prev) : [...prev, p]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadPercent(10);

    const result = await uploadVideoToStorage(file, (percent) => {
      setUploadPercent(percent);
    });

    setIsUploading(false);

    if (result.error) {
      setUploadError(result.error);
    } else if (result.url) {
      setVideoUrl(result.url);
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${title.trim() || 'video-planner'}.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !modelId || !plannedDate) return;

    setIsSaving(true);
    try {
      await upsertVideo({
        id: video?.id,
        model_id: modelId,
        account_id: accountId || undefined,
        title: title.trim(),
        reference_url: referenceUrl.trim(),
        video_url: videoUrl,
        status,
        planned_date: plannedDate,
        platforms,
        notes: notes.trim(),
      });

      if (status === 'Publicado') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      onClose();
    } catch (err) {
      console.error('Error al guardar video:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!video?.id) return;
    if (confirm('¿Estás seguro de que deseas eliminar este video?')) {
      await deleteVideo(video.id);
      onClose();
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <div className="modal-title">
              <Sparkles size={18} />
              <span>{isNew ? 'Nuevo Video' : 'Detalles del Vídeo'}</span>
            </div>
            <button className="modal-close-btn" onClick={onClose} title="Cerrar modal">
              <X size={18} />
            </button>
          </div>

          {/* Form / Body */}
          <form onSubmit={handleSave} className="modal-body">
            {/* Modelo / Creadora y Cuenta de la Modelo */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Modelo / Creadora <span className="req">*</span>
                </label>
                <select
                  className="form-select"
                  value={modelId}
                  onChange={(e) => {
                    const newModelId = e.target.value;
                    setModelId(newModelId);
                    const target = models.find((m) => m.id === newModelId);
                    setAccountId(target?.accounts?.[0]?.id || '');
                  }}
                  disabled={isReadOnly}
                  required
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Cuenta de la Modelo
                </label>
                <select
                  className="form-select"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">-- Toda la creadora / Sin cuenta --</option>
                  {(models.find((m) => m.id === modelId)?.accounts || []).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.handle || acc.name} ({acc.platform}{acc.is_primary ? ' • Principal' : ''})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Título / Concepto */}
            <div className="form-group">
              <label className="form-label">
                Título / Concepto del video <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Trend provocativo, Centímetros..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isReadOnly}
                required
              />
            </div>

            {/* Link de Referencia / Inspo */}
            <div className="form-group">
              <label className="form-label">Link de referencia / Inspo</label>
              <div className="input-with-icon">
                <LinkIcon size={16} />
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.instagram.com/reel/... o TikTok link"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  disabled={isReadOnly}
                />
                {referenceUrl && (
                  <a
                    href={referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Abrir enlace de referencia"
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>
            </div>

            {/* Borrador o Muestra (Video Player & Uploader) */}
            <div className="form-group">
              <label className="form-label">Borrador o Muestra</label>

              {videoUrl ? (
                <div className="video-preview-wrapper">
                  <div className="video-player-container">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                    />
                  </div>

                  <div className="video-action-bar">
                    <button
                      type="button"
                      className="video-btn-secondary"
                      onClick={() => setIsTheaterOpen(true)}
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Vista Previa</span>
                    </button>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {!isReadOnly && (
                        <button
                          type="button"
                          className="video-btn-secondary"
                          style={{ color: 'var(--text-muted)' }}
                          onClick={() => fileInputRef.current?.click()}
                          title="Reemplazar video"
                        >
                          <Upload size={14} />
                          <span>Reemplazar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="video-btn-download"
                        onClick={handleDownload}
                      >
                        <Download size={14} />
                        <span>Descargar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="video-dropzone"
                  onClick={() => !isReadOnly && fileInputRef.current?.click()}
                >
                  <Film size={28} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f1f5f9' }}>
                    {isReadOnly ? 'No hay video de borrador disponible' : 'Haz clic para subir un video de borrador o muestra'}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Formatos MP4, MOV o WebM (máx. 50MB en Supabase)
                  </p>
                </div>
              )}

              {/* Input de archivo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              {/* Barra de progreso de subida */}
              {isUploading && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '6px' }}>
                    <span>Subiendo a Supabase Storage...</span>
                    <span>{uploadPercent}%</span>
                  </div>
                  <div className="upload-progress">
                    <div className="upload-progress-bar" style={{ width: `${uploadPercent}%` }}></div>
                  </div>
                </div>
              )}

              {uploadError && (
                <p style={{ color: '#ef4444', fontSize: '0.76rem', marginTop: '6px' }}>
                  {uploadError}
                </p>
              )}
            </div>

            {/* Fila: Estado & Fecha Planificada */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as VideoStatus)}
                  disabled={isReadOnly}
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Fecha Planificada <span className="req">*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  disabled={isReadOnly}
                  required
                />
              </div>
            </div>

            {/* Plataformas */}
            <div className="form-group">
              <label className="form-label">Plataformas</label>
              <div className="platforms-pill-grid">
                {ALL_PLATFORMS.map((plat) => {
                  const isActive = platforms.includes(plat);
                  return (
                    <button
                      key={plat}
                      type="button"
                      data-platform={plat}
                      className={`platform-pill ${isActive ? 'active' : ''}`}
                      onClick={() => togglePlatform(plat)}
                      disabled={isReadOnly}
                    >
                      {plat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notas / Idea de Ejecución */}
            <div className="form-group">
              <label className="form-label">Notas / Idea de Ejecución</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Instrucciones del plano, outfit, iluminación, texto en pantalla..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isReadOnly}
              />
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ margin: '0 -24px -22px', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
              {!isReadOnly && video?.id && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDelete}
                >
                  <Trash2 size={15} />
                  <span>Eliminar</span>
                </button>
              )}

              {!isReadOnly && (
                <button
                  type="submit"
                  className="btn-primary-gradient"
                  disabled={isSaving}
                >
                  <Check size={16} />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              )}

              <button
                type="button"
                className="btn-modal-close"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Teatro / Fullscreen para Vista Previa */}
      {isTheaterOpen && videoUrl && (
        <div
          className="modal-overlay"
          style={{ zIndex: 120, backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
          onClick={() => setIsTheaterOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '900px',
              width: '90%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsTheaterOpen(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <X size={26} />
            </button>
            <video
              src={videoUrl}
              controls
              autoPlay
              style={{
                maxHeight: '80vh',
                maxWidth: '100%',
                borderRadius: '12px',
                boxShadow: '0 0 40px rgba(139, 92, 246, 0.5)',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
