import React, { useState } from 'react';
import { fromB64, toB64, toHex, xorB, shannonEntropy, strengthInfo } from '../utils/xor';
import { Eye, EyeOff } from './Icons';
import { SAMPLE_PAYLOAD, SAMPLE_KEY } from '../utils/samples';

export default function AnalyzeTab() {
  const [payload, setPayload]   = useState('');
  const [key, setKey]           = useState('');
  const [keyVisible, setKeyVisible] = useState(true);
  const [results, setResults]   = useState(null);
  const [error, setError]       = useState('');

  function doAnalyze() {
    const pB64 = payload.trim();
    const kB64 = key.trim();
    if (!pB64 || !kB64) return;
    try {
      const payloadBytes = fromB64(pB64);
      const keyBytes     = fromB64(kB64);
      const xored        = xorB(payloadBytes, keyBytes);
      const decoded      = new TextDecoder().decode(xored);
      const keyStr       = new TextDecoder().decode(keyBytes);
      const ent          = shannonEntropy(keyBytes);
      const { label, color } = strengthInfo(keyBytes.length * 8);
      setResults({ payloadBytes, keyBytes, keyStr, ent, label, color, decoded });
      setError('');
    } catch (e) {
      setError(e.message);
      setResults(null);
    }
  }

  function prefillAnalyze() {
    setPayload(SAMPLE_PAYLOAD);
    setKey(SAMPLE_KEY);
  }

  return (
    <div>
      <div className="block">
        <div className="field">
          <label>Payload (Base64)</label>
          <textarea
            value={payload}
            onChange={e => setPayload(e.target.value)}
            placeholder="Paste Base64 payload…"
            style={{ minHeight: 100 }}
          />
        </div>
        <div className="field">
          <label>Known key (Base64)</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type={keyVisible ? 'text' : 'password'}
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Paste Base64 key…"
              style={{ flex: 1 }}
            />
            <button
              className="ibtn has-tooltip"
              data-tooltip={keyVisible ? 'Hide key' : 'Show key'}
              onClick={() => setKeyVisible(v => !v)}
            >{keyVisible ? <Eye /> : <EyeOff />}</button>
          </div>
        </div>
      </div>

      <div className="actionbar">
        <div className="spacer" />
        <button className="btn ghost" onClick={prefillAnalyze}>Load sample</button>
        <button className="btn primary" onClick={doAnalyze}>Analyze</button>
      </div>

      {(results || error) && (
        <div className="block">
          <div className="sec">Results</div>
          {error && (
            <div className="ana-grid">
              <div className="ana-row">
                <span className="ana-val" style={{ color: '#c0392b' }}>Error: {error}</span>
              </div>
            </div>
          )}
          {results && (
            <div className="ana-grid">
              <div className="ana-row">
                <span className="ana-lbl">Payload length</span>
                <span className="ana-val">{results.payloadBytes.length} bytes</span>
              </div>
              <div className="ana-row">
                <span className="ana-lbl">Key length</span>
                <span className="ana-val">
                  {results.keyBytes.length} bytes — repeats {Math.ceil(results.payloadBytes.length / results.keyBytes.length)}× across payload
                </span>
              </div>
              <div className="ana-row">
                <span className="ana-lbl">Key entropy</span>
                <span className="ana-val" style={{ color: results.color }}>
                  {results.ent.toFixed(2)} bits/byte — strength: {results.label}
                </span>
              </div>
              <div className="ana-row">
                <span className="ana-lbl">Key (raw)</span>
                <span className="ana-val">{results.keyStr}</span>
              </div>
              <div className="ana-row">
                <span className="ana-lbl">Key (hex)</span>
                <span className="ana-val">{toHex(results.keyBytes)}</span>
              </div>
              <div className="ana-row">
                <span className="ana-lbl">Key (Base64)</span>
                <span className="ana-val">{toB64(results.keyBytes)}</span>
              </div>
              <div className="ana-row">
                <span className="ana-lbl">Decrypted output</span>
                <div className="ana-out">{results.decoded}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
