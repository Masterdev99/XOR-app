import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { toB64, toHex, fromB64, fromHex, shannonEntropy, strengthInfo } from '../utils/xor';
import { Eye, EyeOff, Copy, Refresh, Star, XIcon } from './Icons';

const KeyManager = forwardRef(({ showCharset = false }, ref) => {
  const [tab, setTab]           = useState('manual');
  const [manualKey, setManualKey] = useState('');
  const [visible, setVisible]   = useState(true);
  const [keyFmt, setKeyFmt]     = useState('base64');
  const [size, setSize]         = useState(16);
  const [genOut, setGenOut]     = useState('');
  const [genBits, setGenBits]   = useState(0);
  const [hist, setHist]         = useState([]);
  const [csAlpha, setCsAlpha]   = useState(true);
  const [csNum, setCsNum]       = useState(true);
  const [csSym, setCsSym]       = useState(false);

  // Manual key strength
  const manualBytes = new TextEncoder().encode(manualKey);
  const manualEnt   = shannonEntropy(manualBytes);
  const manualBits  = manualEnt * manualBytes.length;
  const manualStr   = manualKey.length > 0 ? strengthInfo(manualBits) : null;

  // Generated key strength
  const genStr = genBits > 0 ? strengthInfo(genBits) : null;

  useImperativeHandle(ref, () => ({
    getKey() {
      if (tab === 'manual') {
        if (!manualKey) throw new Error('Enter a key in the manual field.');
        return new TextEncoder().encode(manualKey);
      }
      if (!genOut.trim()) throw new Error('Generate a key first (press ⟳).');
      return keyFmt === 'base64' ? fromB64(genOut) : fromHex(genOut);
    },
    getMode() { return tab; },
    // Used by decode prefill to set a manual key value
    setKey(val) {
      setManualKey(val);
      setTab('manual');
    },
  }));

  function genKey() {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    setGenOut(keyFmt === 'base64' ? toB64(bytes) : toHex(bytes));
    setGenBits(size * 8);
  }

  function handleKeyFmtChange(fmt) {
    setKeyFmt(fmt);
    // Regenerate with new format if a key already exists
    if (genOut.trim()) {
      const bytes = new Uint8Array(size);
      crypto.getRandomValues(bytes);
      setGenOut(fmt === 'base64' ? toB64(bytes) : toHex(bytes));
      setGenBits(size * 8);
    }
  }

  function saveHist() {
    const val = genOut.trim();
    if (!val) return;
    setHist(prev => {
      if (prev.includes(val)) return prev;
      return [val, ...prev].slice(0, 8);
    });
  }

  function useHistItem(val) {
    setGenOut(val);
    try { setGenBits(fromB64(val).length * 8); return; } catch (_) {}
    const parts = val.trim().split(' ');
    if (parts.every(p => /^[0-9a-fA-F]{2}$/.test(p))) { setGenBits(parts.length * 8); return; }
    setGenBits(new TextEncoder().encode(val).length * 8);
  }

  function copy(val) {
    if (val) navigator.clipboard.writeText(val);
  }

  return (
    <div className="km">
      <div className="km-tabs">
        <button className={`kmt${tab === 'manual' ? ' active' : ''}`} onClick={() => setTab('manual')}>Manual</button>
        <button className={`kmt${tab === 'generate' ? ' active' : ''}`} onClick={() => setTab('generate')}>Generate</button>
      </div>

      {tab === 'manual' && (
        <div>
          <div className="km-irow">
            <input
              type={visible ? 'text' : 'password'}
              value={manualKey}
              onChange={e => setManualKey(e.target.value)}
              placeholder="Type your key…"
            />
            <button
              className="ibtn has-tooltip"
              data-tooltip={visible ? 'Hide key' : 'Show key'}
              onClick={() => setVisible(v => !v)}
            >{visible ? <Eye /> : <EyeOff />}</button>
            <button className="ibtn has-tooltip" data-tooltip="Copy key" onClick={() => copy(manualKey)}><Copy /></button>
            <button className="ibtn has-tooltip" data-tooltip="Clear key" onClick={() => setManualKey('')}><XIcon /></button>
          </div>
          <div className="km-meta">
            <span className="km-meta-i">length: <span>{manualKey.length}</span></span>
            <span className="km-meta-i">entropy: <span className={manualEnt < 2 ? 'danger' : manualEnt < 4 ? 'warn' : ''}>{manualKey.length ? manualEnt.toFixed(2) + ' b/B' : '—'}</span></span>
            <span className="km-meta-i">strength: <span style={{ color: manualStr?.color || '' }}>{manualStr?.label || '—'}</span></span>
          </div>
          <div className="sbar">
            <div className="sfill" style={{ width: (manualStr?.pct || 0) + '%', background: manualStr?.color || '' }} />
          </div>
        </div>
      )}

      {tab === 'generate' && (
        <div>
          <div className="gen-cfg">
            <div className="gen-cfg-col">
              <label>Key length</label>
              <div className="range-row">
                <input type="range" min="8" max="64" value={size} onChange={e => setSize(+e.target.value)} />
                <span className="rv">{size}</span>
                <span style={{ fontSize: 12, color: 'var(--faint)' }}>bytes</span>
              </div>
            </div>
            <div className="gen-cfg-col">
              <label>Key format</label>
              <div className="pills">
                <button className={`pill${keyFmt === 'base64' ? ' active' : ''}`} onClick={() => handleKeyFmtChange('base64')}>Base64</button>
                <button className={`pill${keyFmt === 'hex' ? ' active' : ''}`} onClick={() => handleKeyFmtChange('hex')}>Hex</button>
              </div>
            </div>
            {showCharset && (
              <div className="gen-cfg-col">
                <label>Charset (string mode)</label>
                <div className="cset">
                  <label className="cset-item"><input type="checkbox" checked={csAlpha} onChange={e => setCsAlpha(e.target.checked)} /><span>a-z A-Z</span></label>
                  <label className="cset-item"><input type="checkbox" checked={csNum} onChange={e => setCsNum(e.target.checked)} /><span>0-9</span></label>
                  <label className="cset-item"><input type="checkbox" checked={csSym} onChange={e => setCsSym(e.target.checked)} /><span>!@#$…</span></label>
                </div>
              </div>
            )}
          </div>
          <div className="gen-out-row">
            <input type="text" value={genOut} readOnly placeholder="Press ⟳ to generate a key" />
            <button className="ibtn has-tooltip" data-tooltip="Generate key" onClick={genKey}><Refresh /></button>
            <button className="ibtn has-tooltip" data-tooltip="Copy key" onClick={() => copy(genOut)}><Copy /></button>
            <button className="ibtn has-tooltip" data-tooltip="Save to history" onClick={saveHist}><Star /></button>
          </div>
          <div className="sbar">
            <div className="sfill" style={{ width: (genStr?.pct || 0) + '%', background: genStr?.color || '' }} />
          </div>
          <div className="gen-meta">
            <span className="gen-meta-i">entropy: <span style={{ color: genStr?.color }}>{genBits > 0 ? genBits + ' bits' : '—'}</span></span>
            <span className="gen-meta-i">strength: <span style={{ color: genStr?.color }}>{genStr?.label || '—'}</span></span>
          </div>
          <div className="hist-section">
            <div className="hist-label">Key history</div>
            <div className="hist-list">
              {hist.length === 0
                ? <span className="hist-empty">No saved keys yet</span>
                : hist.map((v, i) => (
                  <div key={i} className="hist-item">
                    <span className="hist-val" title={v}>{v}</span>
                    <button className="hist-use" onClick={() => useHistItem(v)}>Use</button>
                    <button className="hist-del" title="Remove" onClick={() => setHist(p => p.filter((_, j) => j !== i))}>✕</button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

KeyManager.displayName = 'KeyManager';
export default KeyManager;
