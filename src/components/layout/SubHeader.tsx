import React from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, LayoutGrid, Search, X } from 'lucide-react';

export const SubHeader: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
  } = useApp();

  return (
    <div className="app-subheader">
      <div className="tab-group">
        <button
          className={`tab-btn ${activeTab === 'modelos' ? 'active' : ''}`}
          onClick={() => setActiveTab('modelos')}
        >
          <LayoutGrid size={16} />
          <span>Secciones por Modelo</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'calendario' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendario')}
        >
          <Calendar size={16} />
          <span>Calendario</span>
        </button>
      </div>

      <div className="search-box">
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Buscar videos o notas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
