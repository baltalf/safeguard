const API = process.env.NEXT_PUBLIC_API_URL || 'https://5695-200-80-213-210.ngrok-free.app';

export async function fetchEvents() {
  const res = await fetch(`${API}/api/events`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function fetchEvent(id: string) {
  const res = await fetch(`${API}/api/events/${id}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export async function escalateDispute(id: string) {
  const res = await fetch(`${API}/api/events/${id}/dispute`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to escalate');
  return res.json();
}

export async function verifyOnChain(id: string) {
  const res = await fetch(`${API}/api/events/${id}/verify`);
  if (!res.ok) throw new Error('Failed to verify');
  return res.json();
}
