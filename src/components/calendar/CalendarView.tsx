import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DayCell } from './DayCell';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Model } from '../../types';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

export const CalendarView: React.FC = () => {
  const { filteredVideos, models } = useApp();

  // Fecha inicial en Octubre de 2026 como en la captura original, o el mes actual
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 25)); // 9 = Octubre
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-25');

  // Mapeo rápido de modelos por ID para rendimiento
  const modelsMap = useMemo(() => {
    const map = new Map<string, Model>();
    models.forEach((m) => map.set(m.id, m));
    return map;
  }, [models]);

  // Navegación de meses
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    // Ir al día actual de referencia (25 de Octubre de 2026 o fecha real)
    const refDate = new Date(2026, 9, 25);
    setCurrentDate(refDate);
    setSelectedDateStr('2026-10-25');
  };

  // Generar la matriz del mes (iniciando en Lunes)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Primer día del mes
    const firstDayOfMonth = new Date(year, month, 1);
    // Día de la semana (0 = Domingo, 1 = Lunes, ...)
    let dayOfWeek = firstDayOfMonth.getDay();
    // Convertir para que Lunes sea 0 y Domingo sea 6
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Días en el mes actual
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    // Días en el mes anterior
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Días de relleno del mes anterior
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Días de relleno del mes siguiente (para completar semanas completas de 7 columnas)
    const remainingDays = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remainingDays; d++) {
      days.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Agrupar videos por fecha YYYY-MM-DD
  const videosByDate = useMemo(() => {
    const map = new Map<string, typeof filteredVideos>();
    filteredVideos.forEach((video) => {
      const list = map.get(video.planned_date) || [];
      list.push(video);
      map.set(video.planned_date, list);
    });
    return map;
  }, [filteredVideos]);

  const monthTitle = `${MONTH_NAMES[currentDate.getMonth()]} De ${currentDate.getFullYear()}`;

  return (
    <div className="calendar-wrapper">
      <div className="calendar-card">
        {/* Cabecera del Calendario */}
        <div className="calendar-header">
          <div className="calendar-title">
            <CalendarIcon size={20} color="var(--primary)" />
            <span>{monthTitle}</span>
          </div>

          <div className="calendar-nav">
            <button
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
              title="Mes anterior"
            >
              <ChevronLeft size={17} />
            </button>
            <button className="calendar-today-btn" onClick={handleGoToday}>
              Hoy
            </button>
            <button
              className="calendar-nav-btn"
              onClick={handleNextMonth}
              title="Mes siguiente"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        {/* Nombres de los días de la semana */}
        <div className="weekdays-grid">
          {WEEKDAYS.map((dayName) => (
            <div key={dayName} className="weekday-col">
              {dayName}
            </div>
          ))}
        </div>

        {/* Grilla de Días */}
        <div className="days-grid">
          {calendarDays.map(({ date, isCurrentMonth }, idx) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const isToday = dateStr === '2026-10-25'; // Resaltado idéntico a la captura
            const isSelected = dateStr === selectedDateStr;
            const dayVideos = videosByDate.get(dateStr) || [];

            return (
              <DayCell
                key={`${dateStr}-${idx}`}
                date={date}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                isSelected={isSelected}
                videos={dayVideos}
                modelsMap={modelsMap}
                onSelectDate={setSelectedDateStr}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
