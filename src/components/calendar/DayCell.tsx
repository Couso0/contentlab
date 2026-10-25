import React from 'react';
import type { VideoItem, Model } from '../../types';
import { useApp } from '../../context/AppContext';
import { Plus } from 'lucide-react';

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  videos: VideoItem[];
  modelsMap: Map<string, Model>;
  onSelectDate: (dateStr: string) => void;
}

export const DayCell: React.FC<DayCellProps> = ({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  videos,
  modelsMap,
  onSelectDate,
}) => {
  const { setActiveVideo, userRole, setIsCreateVideoOpen, setPreselectedDate } = useApp();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreselectedDate(dateStr);
    setIsCreateVideoOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Idea / Inspo':
        return 'var(--status-idea)';
      case 'Por Grabar':
        return 'var(--status-shoot)';
      case 'En Edición':
        return 'var(--status-edit)';
      case 'Listo':
        return 'var(--status-ready)';
      case 'Publicado':
        return 'var(--status-published)';
      default:
        return 'var(--primary)';
    }
  };

  return (
    <div
      className={`day-cell ${!isCurrentMonth ? 'outside-month' : ''} ${isToday ? 'is-today' : ''} ${
        isSelected ? 'selected-day' : ''
      }`}
      onClick={() => onSelectDate(dateStr)}
    >
      <div className="day-header">
        <span className="day-number">{date.getDate()}</span>
        {userRole === 'admin' && (
          <button
            className="day-add-btn"
            onClick={handleQuickAdd}
            title={`Programar video para el ${day}/${month}/${year}`}
          >
            <Plus size={13} strokeWidth={2.8} />
          </button>
        )}
      </div>

      <div className="day-videos-list">
        {videos.map((video) => {
          const model = modelsMap.get(video.model_id);
          const modelName = model ? model.name.split(' ')[0] : 'MODELO';
          const statusColor = getStatusColor(video.status);

          return (
            <div
              key={video.id}
              className="video-calendar-chip"
              style={{ borderLeftColor: statusColor }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveVideo(video);
              }}
              title={`${video.title} - ${video.status} (${model?.name || ''})`}
            >
              <span className="video-chip-title">{video.title}</span>
              <div className="video-chip-meta">
                <span className="video-chip-model">{modelName}</span>
                <span
                  className="status-dot-sm"
                  style={{ backgroundColor: statusColor, boxShadow: `0 0 5px ${statusColor}` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
