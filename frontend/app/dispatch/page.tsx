'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { TRUCKS, STOCK_ITEMS, formatARS, getStatusBadge } from '@/lib/types';

interface TripClip { eventId: string; timestamp: string; type: string; duration: number; ipfsUrl?: string; }
interface Trip {
  id: string; remito: string; truck: string; driver: string;
  origin: string; destination: string; cargo: string; value: number;
  status: string; departedAt: string; eta: string; hasIncidents: boolean; clips: TripClip[];
}

const TRIPS: Trip[] = [
  {
    id: 'VJE-001', remito: 'R-2024-047', truck: 'TRK-01', driver: 'Juan Pérez',
    origin: 'Buenos Aires', destination: 'Córdoba',
    cargo: 'Electrodomésticos Samsung', value: 2100000, status: 'en_ruta',
    departedAt: '2026-03-21T08:00:00', eta: '2026-03-21T23:30:00',
    hasIncidents: false, clips: [],
  },
  {
    id: 'VJE-002', remito: 'R-2024-048', truck: 'TRK-03', driver: 'Miguel Torres',
    origin: 'Mendoza', destination: 'Buenos Aires',
    cargo: 'Electrónica importada', value: 1200000, status: 'incidente',
    departedAt: '2026-03-21T06:00:00', eta: '2026-03-21T22:00:00',
    hasIncidents: true,
    clips: [{ eventId: 'evt-001', timestamp: '15:32', type: 'ROBO', duration: 20 }],
  },
  {
    id: 'VJE-003', remito: 'R-2024-046', truck: 'TRK-02', driver: 'Carlos Díaz',
    origin: 'Rosario', destination: 'Buenos Aires',
    cargo: 'Indumentaria deportiva', value: 480000, status: 'en_ruta',
    departedAt: '2026-03-21T10:00:00', eta: '2026-03-21T14:00:00',
    hasIncidents: false, clips: [],
  },
];

const TRAMOS: Record<string, string[]> = {
  'VJE-001': ['BA → Rosario', 'Rosario → CBA'],
  'VJE-002': ['Mendoza → San Luís', 'San Luís → Córdoba', 'Córdoba → BA'],
  'VJE-003': ['Rosario → Zárate', 'Zárate → BA'],
};
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://5695-200-80-213-210.ngrok-free.app';

function statusBadge(status: string) {
  if (status === 'en_ruta') return <span className="badge badge-green">En ruta</span>;
  if (status === 'incidente') return <span className="badge badge-red">Incidente</span>;
  return <span className="badge badge-amber">{status}</span>;
}

function ClipsModal({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const tramos = TRAMOS[trip.id] ?? [];
  const depart = new Date(trip.departedAt);
  const [openVideos, setOpenVideos] = React.useState<Record<number, boolean>>({});

  const toggleVideo = (idx: number) =>
    setOpenVideos(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#0F172A',
        border: '0.5px solid #334155',
        borderRadius: 16,
        width: 560,
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 30px 70px rgba(0,0,0,0.8)',
        padding: 0,
      }} onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <div style={{
          background: '#1E293B',
          padding: '16px 20px',
          borderBottom: '0.5px solid #334155',
          borderRadius: '16px 16px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#F1F5F9' }}>{trip.id} — Grabaciones</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{trip.truck} · {trip.remito}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {/* BODY */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {trip.hasIncidents ? (
            <>
              {/* Incident clips layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Normal segment before incident */}
                <div style={{ background: '#1E293B', border: '0.5px solid #334155', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: openVideos[999] ? 10 : 0 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#F1F5F9' }}>
                        {depart.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} → {trip.clips[0].timestamp}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Sin eventos · Grabación continua</div>
                    </div>
                    <span style={{ background: '#052e16', color: '#10B981', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>SIN ALERTAS</span>
                  </div>
                  <button
                    onClick={() => toggleVideo(999)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <span style={{ fontSize: 14, color: '#64748B' }}>{openVideos[999] ? '▼' : '▶'}</span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{openVideos[999] ? 'Ocultar grabación' : 'Ver grabación'}</span>
                  </button>
                  {openVideos[999] && (
                    <video controls style={{ width: '100%', borderRadius: 8, display: 'block', background: '#0F172A', marginTop: 10 }}>
                      <source src={`${API_URL}/api/media/video_normal.mp4`} type="video/mp4" />
                    </video>
                  )}
                </div>

                {/* Incident clips */}
                {trip.clips.map((clip, i) => (
                  <div key={i} style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 18 }}>⚠</span>
                          <span style={{ fontWeight: 700, color: '#f87171', fontSize: 14 }}>{clip.timestamp} — INCIDENTE DETECTADO</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#fca5a5' }}>Clip de {clip.duration}s · Tipo: {clip.type}</div>
                      </div>
                      <span className="badge badge-red">{clip.type}</span>
                    </div>
                    
                    <button
                      onClick={() => toggleVideo(1000 + i)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: openVideos[1000 + i] ? 10 : 0 }}
                    >
                      <span style={{ fontSize: 14, color: '#f87171' }}>{openVideos[1000 + i] ? '▼' : '▶'}</span>
                      <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>{openVideos[1000 + i] ? 'Ocultar clip de incidente' : 'Ver clip de incidente'}</span>
                    </button>

                    {openVideos[1000 + i] && (
                      <video controls style={{ width: '100%', borderRadius: 8, display: 'block', background: '#0F172A', marginBottom: 10 }}>
                        <source src={`${API_URL}/api/media/video_robo.mp4`} type="video/mp4" />
                      </video>
                    )}
                    
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <Link href={`/events/${clip.eventId}`} className="sg-btn sg-btn-ghost" style={{ fontSize: 12, textDecoration: 'none', padding: '6px 12px' }}>
                        Ver evidencia blockchain →
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Normal segment after incident */}
                <div style={{ background: '#1E293B', border: '0.5px solid #334155', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#F1F5F9' }}>16:19 → En curso</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Continúa…</div>
                    </div>
                    <span style={{ background: '#1e3a8a', color: '#60a5fa', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>EN CURSO</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* No incidents Header Card */}
              <div style={{
                background: '#052e16',
                border: '0.5px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 18, color: '#10B981', fontWeight: 700 }}>✓</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#10B981', fontSize: 14 }}>Viaje sin incidentes</div>
                  <div style={{ fontSize: 12, color: '#6ee7b7', marginTop: 2, opacity: 0.9 }}>Todas las grabaciones verificadas on-chain</div>
                </div>
              </div>

              {/* Tramos with collapsible videos */}
              {tramos.map((tramo, i) => (
                <div key={i} style={{ background: '#1E293B', border: '0.5px solid #334155', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#F1F5F9' }}>Tramo {tramo}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Sin eventos · Grabación continua</div>
                    </div>
                    <span style={{ background: '#052e16', color: '#10B981', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>SIN ALERTAS</span>
                  </div>
                  
                  {/* Click row for showing video */}
                  <button
                    onClick={() => toggleVideo(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <span style={{ fontSize: 14, color: '#64748B' }}>{openVideos[i] ? '▼' : '▶'}</span>
                    <span style={{ fontSize: 12, color: openVideos[i] ? '#94A3B8' : '#64748B' }}>{openVideos[i] ? 'Ocultar grabación' : 'Ver grabación'}</span>
                  </button>

                  {openVideos[i] && (
                    <video controls style={{ width: '100%', borderRadius: 8, display: 'block', background: '#0F172A', marginTop: 10 }}>
                      <source src={`${API_URL}/api/media/video_normal.mp4`} type="video/mp4" />
                    </video>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Nuevo despacho modal ────────────────────────────────────── */
function NewDispatchModal({ onClose }: { onClose: () => void }) {
  const [truck, setTruck] = useState(TRUCKS[0].id);
  const [remito, setRemito] = useState('');
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [sku, setSku] = useState(STOCK_ITEMS[0].id);
  const [qty, setQty] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!remito || !origin || !dest) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 150,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: '#0F172A', border: '0.5px solid #334155',
        borderRadius: 16, padding: '28px 32px', width: 560, maxWidth: '90vw',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Nuevo despacho</h2>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 20 }}
            onMouseOver={e => e.currentTarget.style.color = '#F1F5F9'}
            onMouseOut={e => e.currentTarget.style.color = '#64748B'}
          >✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-2)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Camión</label>
              <select className="sg-input" value={truck} onChange={e => setTruck(e.target.value)}>
                {TRUCKS.map(t => <option key={t.id} value={t.id}>{t.id} — {t.driver.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-2)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>N° Remito</label>
              <input className="sg-input" placeholder="R-2024-XXX" value={remito} onChange={e => setRemito(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-2)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Origen</label>
              <input className="sg-input" placeholder="Ciudad de origen" value={origin} onChange={e => setOrigin(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-2)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Destino</label>
              <input className="sg-input" placeholder="Ciudad de destino" value={dest} onChange={e => setDest(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-2)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Producto</label>
              <select className="sg-input" value={sku} onChange={e => setSku(e.target.value)}>
                {STOCK_ITEMS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-2)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cant.</label>
              <input className="sg-input" type="number" min={1} value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <button style={{ 
            background: '#2563EB', color: 'white', width: '100%', marginTop: 20, 
            padding: '10px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', transition: '0.2s'
          }} onClick={submit}
            onMouseOver={e => e.currentTarget.style.background = '#1D4ED8'}
            onMouseOut={e => e.currentTarget.style.background = '#2563EB'}
          >
            {submitted ? '✓ Viaje iniciado' : '🚛 Iniciar viaje'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function DispatchPage() {
  const [filter, setFilter] = useState<'all' | 'en_ruta' | 'incidente'>('all');
  const [modalTrip, setModalTrip] = useState<Trip | null>(null);
  const [showNewDispatch, setShowNewDispatch] = useState(false);

  const trips = filter === 'all' ? TRIPS : TRIPS.filter(t => t.status === filter);

  return (
    <div style={{ padding: 28 }}>
      {modalTrip && <ClipsModal trip={modalTrip} onClose={() => setModalTrip(null)} />}

      {/* Viajes activos */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>Viajes activos</h1>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
              {TRIPS.length} viajes · {TRIPS.filter(t => t.hasIncidents).length} con incidentes
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {([['all', 'Todos'], ['en_ruta', 'En ruta'], ['incidente', 'Con incidente']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={filter === key ? 'sg-btn sg-btn-primary' : 'sg-btn sg-btn-ghost'}
                  style={{ fontSize: 12 }}
                >
                  {label}
                </button>
              ))}
            </div>
            
            {/* Nuevo Despacho Button */}
            <button 
              onClick={() => setShowNewDispatch(true)}
              style={{
                background: '#2563EB',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#1D4ED8'}
              onMouseOut={e => e.currentTarget.style.background = '#2563EB'}
            >
              + Nuevo despacho
            </button>
          </div>
        </div>

        <div className="sg-card" style={{ overflow: 'hidden' }}>
          <table className="sg-table">
            <thead>
              <tr>
                <th>Viaje</th><th>Camión / Conductor</th><th>Ruta</th>
                <th>Carga</th><th>Valor</th><th>Salida</th><th>ETA</th>
                <th>Estado</th><th>Grabaciones</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 600 }}>{trip.id}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: "'IBM Plex Mono',monospace" }}>{trip.remito}</div>
                  </td>
                  <td>
                    <Link href={`/fleet/${trip.truck}`} style={{ fontWeight: 600, color: 'var(--text-1)', textDecoration: 'none' }}>{trip.truck}</Link>
                    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{trip.driver}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <span>{trip.origin}</span>
                      <span style={{ color: 'var(--text-3)' }}>→</span>
                      <span>{trip.destination}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.cargo}</div>
                  </td>
                  <td><span style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatARS(trip.value)}</span></td>
                  <td style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--text-2)' }}>
                    {new Date(trip.departedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>
                    {new Date(trip.eta).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {statusBadge(trip.status)}
                      {trip.hasIncidents && (
                        <span className="badge badge-red">{trip.clips.length} clip{trip.clips.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      className="sg-btn sg-btn-ghost"
                      style={{ fontSize: 12 }}
                      onClick={() => setModalTrip(trip)}
                    >
                      {trip.hasIncidents ? '⚠ Ver clips' : '▶ Ver grabaciones'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New dispatch modal */}
      {showNewDispatch && <NewDispatchModal onClose={() => setShowNewDispatch(false)} />}
    </div>
  );
}
