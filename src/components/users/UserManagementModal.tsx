import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { AppUser, UserRole } from '../../types';
import {
  Users,
  X,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  UserCheck,
  Key,
  Check,
  AlertCircle,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, upsertUser, deleteUser } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Campos de formulario
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('lector');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('lector');
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUserId(user.id);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password);
    setRole(user.role);
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !username.trim() || !password.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    // Verificar si el username ya está ocupado por otro usuario
    const duplicate = users.find(
      (u) =>
        u.id !== editingUserId &&
        u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (duplicate) {
      setErrorMsg(`El usuario "@${username.trim()}" ya está en uso.`);
      return;
    }

    setIsSaving(true);
    try {
      await upsertUser({
        id: editingUserId || undefined,
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        role,
      });
      setIsEditing(false);
      setEditingUserId(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteUser(id);
    setConfirmingDeleteId(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        {/* Cabecera del Modal */}
        <div className="modal-header">
          <div
            className="modal-title"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
            }}
          >
            <Users size={20} />
            <span>Gestión de Usuarios y Roles</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '20px' }}>
          {/* Formulario de Creación / Edición */}
          {isEditing ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff' }}>
                  {editingUserId ? 'Editar Credenciales y Rol' : 'Crear Nuevo Usuario'}
                </h3>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '4px 12px', fontSize: '0.76rem' }}
                  onClick={handleCancelForm}
                >
                  Volver a la lista
                </button>
              </div>

              {errorMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '0.78rem',
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Nombre Completo <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Nombre de Usuario o Correo <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="usuario123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Contraseña <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contraseña de acceso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Rol del Usuario <span className="req">*</span>
                </label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="lector">Lector (Solo Lectura, visualización y descarga)</option>
                  <option value="admin">Administrador (Control total, modelos, videos y base de datos)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={handleCancelForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-gradient" disabled={isSaving}>
                  <Check size={16} />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Usuario'}</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Barra superior de acciones de la lista */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Administra las cuentas con acceso al sistema, cambia contraseñas y asigna roles.
                  </p>
                </div>
                <button className="btn-primary-gradient" onClick={handleOpenCreate}>
                  <Plus size={16} strokeWidth={2.4} />
                  <span>Crear Usuario</span>
                </button>
              </div>

              {/* Lista de Usuarios */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        gap: '14px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            backgroundColor:
                              u.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: u.role === 'admin' ? '#c084fc' : '#38bdf8',
                          }}
                        >
                          {u.role === 'admin' ? <ShieldCheck size={20} /> : <UserCheck size={20} />}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {u.name}
                            </span>
                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: '0.64rem',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                  color: '#34d399',
                                  fontWeight: 600,
                                }}
                              >
                                Tú
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                              @{u.username}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>•</span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Key size={11} />
                              <code>{u.password}</code>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Badge de Rol y Botones de Acción */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor:
                              u.role === 'admin' ? 'rgba(217, 70, 239, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: u.role === 'admin' ? '#e879f9' : '#38bdf8',
                            border: `1px solid ${
                              u.role === 'admin' ? 'rgba(217, 70, 239, 0.3)' : 'rgba(56, 189, 248, 0.3)'
                            }`,
                          }}
                        >
                          {u.role === 'admin' ? 'Administrador' : 'Lector'}
                        </span>

                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleOpenEdit(u)}
                          title="Editar credenciales y rol"
                        >
                          <Edit2 size={15} />
                        </button>

                        {!isCurrent && (
                          confirmingDeleteId === u.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleDelete(u.id)}
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                }}
                                onClick={() => setConfirmingDeleteId(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="icon-btn"
                              style={{ color: '#f87171' }}
                              onClick={() => setConfirmingDeleteId(u.id)}
                              title="Eliminar usuario"
                            >
                              <Trash2 size={15} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer de Modal */}
          <div
            className="modal-footer"
            style={{
              margin: '0 -24px -22px',
              borderBottomLeftRadius: 'var(--radius-lg)',
              borderBottomRightRadius: 'var(--radius-lg)',
            }}
          >
            <button type="button" className="btn-modal-close" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
