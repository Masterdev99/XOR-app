export function xorB(payload, key) {
  const out = new Uint8Array(payload.length);
  for (let i = 0; i < payload.length; i++) out[i] = payload[i] ^ key[i % key.length];
  return out;
}

// Fix: avoid spread of large arrays into String.fromCharCode which hits call stack limit
export function toB64(b) {
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

export function fromB64(s) {
  const b = atob(s.trim());
  return Uint8Array.from(b, c => c.charCodeAt(0));
}

export function toHex(b) {
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join(' ');
}

export function fromHex(s) {
  return new Uint8Array(
    s.trim().replace(/\s+/g, ' ').split(' ').map(h => parseInt(h, 16))
  );
}

export function shannonEntropy(bytes) {
  if (!bytes.length) return 0;
  const freq = {};
  for (const b of bytes) freq[b] = (freq[b] || 0) + 1;
  let H = 0;
  for (const k in freq) { const p = freq[k] / bytes.length; H -= p * Math.log2(p); }
  return isNaN(H) ? 0 : H;
}

export function strengthInfo(bits) {
  if (bits < 64)  return { label: 'weak',   color: '#c0392b', pct: 20 };
  if (bits < 128) return { label: 'fair',   color: '#b7791f', pct: 45 };
  if (bits < 256) return { label: 'good',   color: '#4d7c0f', pct: 70 };
                  return { label: 'strong', color: '#15803d', pct: 100 };
}
