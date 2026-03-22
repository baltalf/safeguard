'use client';
import React, { useEffect, useState } from 'react';
import { fetchEvents, escalateDispute, verifyOnChain } from '@/lib/api';
import { SGEvent, getBlockchainBadge, getVerdictBadge } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://5695-200-80-213-210.ngrok-free.app';

type Step = { label: string; detail: string | null; done: boolean };

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [event, setEvent] = useState<SGEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputing, setDisputing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents()
      .then((data: SGEvent[]) => {
        const found = Array.isArray(data) ? data.find((e) => e.id === id) : null;
        setEvent(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const handleDispute = async () => {
    if (!event) return;
    setDisputing(true);
    try {
      const res = await escalateDispute(event.id);
      setEvent((prev) =>
        prev ? { ...prev, genlayer_verdict: res.genlayer_verdict, ipfs_cid: res.ipfs_cid, ipfs_url: res.ipfs_url } : null
      );
    } catch { } finally { setDisputing(false); }
  };

  const handleVerify = async () => {
    if (!event) return;
    setVerifying(true);
    try {
      const res = await verifyOnChain(event.id);
      setEvent((prev) =>
        prev
          ? { ...prev, blockchain_status: res.verified ? 'verified_l1' : prev.blockchain_status, blockchain_tx: res.blockchain_tx ?? prev.blockchain_tx }
          : null
      );
    } catch { } finally { setVerifying(false); }
  };

  if (loading) return (
    <div style={{ padding: 40, color: 'var(--text-3)', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>
      Buscando evento...
    </div>
  );
  if (!event) return (
    <div style={{ padding: 40, color: 'var(--danger)' }}>
      Evento no encontrado (id: {id})
    </div>
  );

  const ts = event.timestamp ? new Date(event.timestamp) : null;

  const custodySteps: Step[] = [
    { label: 'Detectado por Edge AI', detail: ts?.toLocaleString('es-AR') ?? null, done: true },
    { label: 'Clip generado (20s)', detail: event.clip_path ? 'Guardado en storage local' : null, done: !!event.clip_path },
    { label: 'Hash SHA-256 calculado', detail: event.hash_sha256?.substring(0, 12) ?? null, done: !!event.hash_sha256 },
    { label: 'Video subido a IPFS', detail: event.ipfs_cid ? event.ipfs_cid.substring(0, 12) + '...' : 'Sin IPFS (local only)', done: !!event.ipfs_cid },
    { label: 'Registrado en Avalanche L1', detail: event.blockchain_tx?.substring(0, 10) ?? null, done: !!event.blockchain_tx },
    { label: 'Veredicto Genlayer', detail: event.genlayer_verdict ?? null, done: !!event.genlayer_verdict },
  ];

  const keyFrames: string[] = Array.isArray(event.metadata?.key_frames) ? event.metadata.key_frames : [];

  return (
    <div style={{ padding: 28, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Left: Frames + metadata */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <span className="badge badge-red" style={{ fontSize: 13, padding: '5px 12px', marginBottom: 10, display: 'inline-block' }}>
            {event.type}
          </span>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Reporte de incidente</h1>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: "'IBM Plex Mono',monospace" }}>
            ID: {event.id} · Cámara: {event.camera_id}
          </div>
        </div>

        {/* Frames */}
        <div className="sg-card" style={{ padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Fotogramas clave ({keyFrames.length})
          </h2>
          {keyFrames.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {keyFrames.map((path, i) => (
                <img
                  key={i}
                  src={`${API_URL}/${path}`}
                  alt={`Frame ${i + 1}`}
                  style={{ width: '100%', borderRadius: 6, border: '1px solid var(--border)', display: 'block' }}
                />
              ))}
            </div>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 12, gap: 10, flexDirection: 'column' }}>
              <span style={{ fontSize: 32 }}>🎥</span>
              Sin fotogramas disponibles
            </div>
          )}
        </div>

        {/* Incident description */}
        {event.incident_description && (
          <div className="sg-card" style={{ padding: 20, marginBottom: 16 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Descripción del incidente
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.7 }}>{event.incident_description}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="sg-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Metadata</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
            {[
              { l: 'Módulo Edge', v: event.module },
              { l: 'Confianza ML', v: `${((event.confidence ?? 0) * 100).toFixed(1)}%` },
              { l: 'Timestamp', v: ts?.toLocaleString('es-AR') ?? '—' },
              { l: 'Blockchain', v: event.blockchain_status },
            ].map(({ l, v }) => (
              <div key={l}>
                <div style={{ color: 'var(--text-3)', fontSize: 10, textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                <div style={{ color: 'var(--text-1)' }}>{v ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Evidence cards */}
      <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Blockchain + IPFS evidence */}
        <div className="sg-card" style={{ padding: 20, borderTop: '2px solid var(--danger)' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Evidencia inmutable</h2>

          {/* Hash */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hash SHA-256</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{ flex: 1, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--success)', background: 'var(--bg)', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                {event.hash_sha256 ?? '—'}
              </code>
              {event.hash_sha256 && (
                <button onClick={() => copy(event.hash_sha256!, 'hash')} className="sg-btn sg-btn-ghost" style={{ flexShrink: 0, fontSize: 11 }}>
                  {copied === 'hash' ? '✓' : '⎘'}
                </button>
              )}
            </div>
          </div>

          {/* TX */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TX Hash Avalanche L1</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{ flex: 1, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--info)', background: 'var(--bg)', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                {event.blockchain_tx ?? 'Sin TX (pendiente)'}
              </code>
              {event.blockchain_tx && (
                <button onClick={() => copy(event.blockchain_tx!, 'tx')} className="sg-btn sg-btn-ghost" style={{ flexShrink: 0, fontSize: 11 }}>
                  {copied === 'tx' ? '✓' : '⎘'}
                </button>
              )}
            </div>
          </div>

          {/* IPFS Video */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Video de evidencia</div>
            {event.ipfs_url ? (
              <div style={{ background: '#0c1a35', border: '1px solid #1e3a5f', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span>🔗</span>
                  <span className="badge badge-blue">Video inmutable · IPFS</span>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#60a5fa', wordBreak: 'break-all', marginBottom: 10, lineHeight: 1.5 }}>
                  {event.ipfs_cid}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    href={event.ipfs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sg-btn sg-btn-secondary"
                    style={{ fontSize: 12, textDecoration: 'none' }}
                  >
                    Ver video en IPFS →
                  </a>
                  <button onClick={() => copy(event.ipfs_cid!, 'cid')} className="sg-btn sg-btn-ghost" style={{ fontSize: 11 }}>
                    {copied === 'cid' ? '✓ Copiado' : '⎘ CID'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
                  💾 Video en storage local · IPFS no configurado
                </div>
                {event.clip_path && (
                  <a
                    href={`${API_URL}/${event.clip_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sg-btn sg-btn-ghost"
                    style={{ fontSize: 12, textDecoration: 'none' }}
                  >
                    ▶ Reproducir desde storage local
                  </a>
                )}
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 8, fontFamily: "'IBM Plex Mono',monospace" }}>
                  Configurar PINATA_JWT en .env para subir a IPFS
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span className={getBlockchainBadge(event.blockchain_status)}>{event.blockchain_status || 'pending'}</span>
            <button className="sg-btn sg-btn-secondary" onClick={handleVerify} disabled={verifying} style={{ fontSize: 12 }}>
              {verifying ? 'Verificando...' : 'Verificar on-chain'}
            </button>
          </div>
        </div>

        {/* Genlayer verdict */}
        <div className="sg-card" style={{ padding: 20, borderTop: '2px solid #7c3aed' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Veredicto Genlayer</h2>
          {event.genlayer_verdict ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span className={getVerdictBadge(event.genlayer_verdict)} style={{ fontSize: 15, padding: '8px 20px' }}>
                {event.genlayer_verdict}
              </span>
              {event.ipfs_cid && (
                <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-3)' }}>
                  Veredicto basado en descripción + IPFS ipfs://{event.ipfs_cid.substring(0, 20)}...
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.6 }}>
                Enviar descripción + hash{event.ipfs_cid ? ' + CID IPFS' : ''} al contrato de Genlayer para arbitraje autónomo.
              </p>
              <button
                className="sg-btn sg-btn-primary"
                style={{ width: '100%', justifyContent: 'center', background: '#7c3aed', fontSize: 13 }}
                onClick={handleDispute}
                disabled={disputing}
              >
                {disputing ? '⏳ Consultando oráculo...' : 'Iniciar disputa en Genlayer'}
              </button>
            </div>
          )}
        </div>

        {/* Custody chain */}
        <div className="sg-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Cadena de custodia</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {custodySteps.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: step.done ? 'var(--success)' : 'var(--bg)',
                  border: `2px solid ${step.done ? 'var(--success)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: step.done ? '#fff' : 'var(--text-3)',
                }}>
                  {step.done ? '✓' : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: step.done ? 'var(--text-1)' : 'var(--text-3)' }}>
                    {step.label}
                  </div>
                  {step.detail && (
                    <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--text-2)', marginTop: 2 }}>
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
