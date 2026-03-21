import { useState } from 'react';
import { format } from 'date-fns';

const VERDICT_COLORS = {
  ACCIDENTE_REAL: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  FRAUDE_SOSPECHOSO: 'bg-red-500/20 text-red-400 border-red-500/50',
  INCONCLUSO: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
};

export function EventCard({ event: initialEvent }) {
  const [event, setEvent] = useState(initialEvent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ts = event.timestamp ? new Date(event.timestamp) : new Date();
  const tx = event.blockchain_tx;

  const handleDispute = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const res = await fetch(`${apiUrl}/api/events/${event.id}/dispute`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Error al iniciar disputa');
      const data = await res.json();
      setEvent(prev => ({ ...prev, genlayer_verdict: data.genlayer_verdict }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-zinc-800/80 border border-zinc-700 hover:border-zinc-600 transition-colors flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-700/50 pb-2">
        <span className="font-mono text-base font-semibold text-amber-400">{event.type}</span>
        <div className="flex items-center gap-2">
          {event.genlayer_verdict && (
            <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${VERDICT_COLORS[event.genlayer_verdict] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
              {event.genlayer_verdict}
            </span>
          )}
          {tx ? (
            <a 
              href={`#${tx}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30 transition-colors flex-shrink-0"
              title={tx}
            >
              On-chain ✓ {tx.substring(0, 10)}...
            </a>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded border bg-zinc-500/20 text-zinc-400 border-zinc-500/50 flex-shrink-0">
              Pendiente
            </span>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-end gap-2">
        <div className="text-sm text-zinc-400 flex-grow">
          <p>{event.module} · {event.camera_id || '-'}</p>
          <p className="mt-1 text-xs text-zinc-500">{format(ts, 'yyyy-MM-dd HH:mm:ss')}</p>
        </div>
        
        {!event.genlayer_verdict && (
          <button 
            onClick={handleDispute} 
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Consultando IA descentralizada...
              </>
            ) : (
              "Iniciar disputa"
            )}
          </button>
        )}
      </div>
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}
