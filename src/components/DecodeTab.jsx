import React, { useState, useRef } from 'react';
import KeyManager from './KeyManager';
import { xorB, fromB64, fromHex } from '../utils/xor';
import { SAMPLE_PAYLOAD, SAMPLE_KEY } from '../utils/samples';

const IN_FMTS   = ['base64', 'hex', 'raw'];
const IN_LABELS = ['Base64', 'Hex', 'Raw'];

export default function DecodeTab() {
  const [payload, setPayload] = useState('');
  const [inFmt, setInFmt]     = useState('base64');
  const [decOut, setDecOut]   = useState('');
  const [decErr, setDecErr]   = useState('');
  const [badge, setBadge]     = useState('');
  const [copied, setCopied]   = useState(false);
  const keyRef = useRef();

  function doDecode() {
    setDecErr('');
    const p = payload.trim();
    if (!p) { setDecErr('Enter encoded payload.'); return; }
    try {
      const key = keyRef.current.getKey();
      let bytes;
      if (inFmt === 'base64')     bytes = fromB64(p);
      else if (inFmt === 'hex')   bytes = fromHex(p);
      else bytes = new Uint8Array(p.split(',').map(n => parseInt(n.trim())));
      setDecOut(new TextDecoder().decode(xorB(bytes, key)));
      setBadge(keyRef.current.getMode());
    } catch (e) {
      setDecErr(e.message);
    }
  }

  function prefill() {
    setPayload(SAMPLE_PAYLOAD);
    setInFmt('base64');
    keyRef.current?.setKey(SAMPLE_KEY);
  }

  function clearTab() {
    setPayload('');
    setDecOut('');
    setDecErr('');
    setBadge('');
  }

  function copyOut() {
    if (!decOut) return;
    navigator.clipboard.writeText(decOut).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div>
      <div className="block">
        <label>Encoded payload</label>
        <textarea value={payload} onChange={e => setPayload(e.target.value)} placeholder="Paste Base64, hex, or raw XOR'd bytes…" />
      </div>

      <div className="block">
        <label>Key</label>
        <KeyManager ref={keyRef} />
      </div>

      <div className="actionbar">
        <div className="fmt-inline">
          <span>Input</span>
          <div className="pills">
            {IN_FMTS.map((fmt, i) => (
              <button key={fmt} className={`pill${inFmt === fmt ? ' active' : ''}`} onClick={() => setInFmt(fmt)}>
                {IN_LABELS[i]}
              </button>
            ))}
          </div>
        </div>
        <div className="spacer" />
        <button className="btn ghost" onClick={prefill}>Load sample</button>
        <button className="btn ghost" onClick={clearTab}>Clear</button>
        <button className="btn primary" onClick={doDecode}>Decode</button>
      </div>

      <div className="block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <div className="sec" style={{ margin: 0 }}>
            Decrypted output{badge && <span className="badge">{badge === 'generate' ? 'generated key' : 'manual key'}</span>}
          </div>
          <button className={`cbtn${copied ? ' ok' : ''}`} onClick={copyOut}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <div className={`obox${!decOut ? ' empty' : ''}`}>{decOut || '—'}</div>
        {decErr && <div className="err">{decErr}</div>}
      </div>
    </div>
  );
}
