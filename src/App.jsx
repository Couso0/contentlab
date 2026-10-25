import React, { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://eeksouotnjqhfxywfuvh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yn1K0PuqxX6fZehRQBmqAw_wArBvDf_';
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export default function App() {
  const [dbStatus, setDbStatus] = useState('Conectando...');
  const [modelsData, setModelsData] = useState([]);
  const [videosData, setVideosData] = useState([]);

  useEffect(() => {
    async function testConnection() {
      if (!supabase) {
        setDbStatus('Error: Supabase no está cargado globalmente.');
        return;
      }
      try {
        const { data: models, error: mErr } = await supabase.from('models').select('*');
        const { data: videos, error: vErr } = await supabase.from('videos').select('*');

        if (mErr || vErr) {
          setDbStatus(`Error de Supabase: ${mErr?.message || vErr?.message}`);
        } else {
          setDbStatus('¡Conexión exitosa con Supabase!');
          setModelsData(models || []);
          setVideosData(videos || []);
        }
      } catch (e) {
        setDbStatus(`Excepción: ${e.message}`);
      }
    }
    testConnection();
  }, []);

  return (
    <div style={{ padding: '40px', background: '#09090b', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Diagnóstico de Supabase</h1>
      <p style={{ padding: '15px', background: '#18181b', borderRadius: '8px', border: '1px solid #27272a' }}>
        <strong>Estado:</strong> {dbStatus}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
        <div style={{ background: '#18181b', padding: '20px', borderRadius: '12px', border: '1px solid #27272a' }}>
          <h2>Modelos en la BD ({modelsData.length})</h2>
          <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '300px', marginTop: '10px' }}>
            {JSON.stringify(modelsData, null, 2)}
          </pre>
        </div>

        <div style={{ background: '#18181b', padding: '20px', borderRadius: '12px', border: '1px solid #27272a' }}>
          <h2>Vídeos en la BD ({videosData.length})</h2>
          <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '300px', marginTop: '10px' }}>
            {JSON.stringify(videosData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
