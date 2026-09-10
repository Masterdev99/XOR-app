import React, { useState, useRef } from 'react';
import KeyManager from './KeyManager';
import { xorB, toB64, toHex } from '../utils/xor';
import { renderStubCode } from '../utils/stub';

const OUT_FMTS = ['base64', 'hex', 'raw'];
const OUT_LABELS = ['Base64', 'Hex', 'Raw bytes'];
const STUB_STYLES = ['browser', 'node', 'wscript'];
const STUB_LABELS = ['Browser JS', 'Node.js', 'WScript'];

function fmtBlob(blob, fmt) {
  if (fmt === 'base64') return toB64(blob);
  if (fmt === 'hex')    return toHex(blob);
  return Array.from(blob).join(', ');
}

export default function EncodeTab() {
  const [plain, setPlain]         = useState('');
  const [outFmt, setOutFmt]       = useState('base64');
  const [blobOpen, setBlobOpen]   = useState(false);
  const [encOut, setEncOut]       = useState('');
  const [encErr, setEncErr]       = useState('');
  const [badge, setBadge]         = useState('');
  const [stub, setStub]           = useState(null); // { blob, keyRaw, blobFmt }
  const [stubStyle, setStubStyle] = useState('browser');
  const [stubFmt, setStubFmt]     = useState('base64');
  const [blobCopied, setBlobCopied]   = useState(false);
  const [stubCopied, setStubCopied]   = useState(false);
  const keyRef = useRef();

  function doEncode() {
    setEncErr('');
    if (!plain.trim()) { setEncErr('Enter plaintext.'); return; }
    try {
      const keyRaw = keyRef.current.getKey();
      const xored  = xorB(new TextEncoder().encode(plain), keyRaw);
      const r = fmtBlob(xored, outFmt);
      setEncOut(r);
      setBadge(keyRef.current.getMode());
      setStub({ blob: xored, keyRaw, blobFmt: outFmt });
      setStubFmt(outFmt);
    } catch (e) {
      setEncErr(e.message);
    }
  }

  function handleOutFmtChange(fmt) {
    setOutFmt(fmt);
    setStubFmt(fmt);
    if (stub) {
      setStub(s => ({ ...s, blobFmt: fmt }));
      setEncOut(fmtBlob(stub.blob, fmt));
    }
  }

  function handleStubFmtChange(fmt) {
    setStubFmt(fmt);
    setOutFmt(fmt);
    if (stub) {
      setStub(s => ({ ...s, blobFmt: fmt }));
      setEncOut(fmtBlob(stub.blob, fmt));
    }
  }

  function clearTab() {
    setPlain('');
    setEncOut('');
    setEncErr('');
    setBadge('');
    setStub(null);
    setBlobOpen(false);
  }

  function copyBlob() {
    if (!encOut) return;
    navigator.clipboard.writeText(encOut).then(() => {
      setBlobCopied(true);
      setTimeout(() => setBlobCopied(false), 1500);
    });
  }

  function copyStub() {
    if (!stub) return;
    const code = renderStubCode({ ...stub, blobFmt: stubFmt }, stubStyle);
    navigator.clipboard.writeText(code).then(() => {
      setStubCopied(true);
      setTimeout(() => setStubCopied(false), 1500);
    });
  }

  const stubCode = stub ? renderStubCode({ ...stub, blobFmt: stubFmt }, stubStyle) : '';

  return (
    <div>
      <div className="block">
        <label>Plaintext</label>
        <textarea value={plain} onChange={e => setPlain(e.target.value)} placeholder="Enter text to encode…" />
      </div>

      <div className="block">
        <label>Key</label>
        <KeyManager ref={keyRef} showCharset />
      </div>

      <div className="actionbar">
        <div className="fmt-inline">
          <span>Output</span>
          <div className="pills">
            {OUT_FMTS.map((fmt, i) => (
              <button key={fmt} className={`pill${outFmt === fmt ? ' active' : ''}`} onClick={() => handleOutFmtChange(fmt)}>
                {OUT_LABELS[i]}
              </button>
            ))}
          </div>
        </div>
        <div className="spacer" />
        <button className="btn ghost" onClick={clearTab}>Clear</button>
        <button className="btn primary" onClick={doEncode}>Encode</button>
      </div>

      {/* Encoded blob — collapsible */}
      <div className="blob-strip" id="blob-card">
        <button className="blob-head" onClick={() => setBlobOpen(o => !o)}>
          <span className={`blob-chevron${blobOpen ? ' open' : ''}`}>▶</span>
          <span className="blob-title">Encoded blob</span>
          {badge && <span className="badge">{badge === 'generate' ? 'generated key' : 'manual key'}</span>}
          {encOut && <span className="blob-hint">{encOut.length} chars</span>}
        </button>
        <div className={`blob-body${blobOpen ? ' open' : ''}`}>
          <div className="blob-inner">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 7 }}>
              <button className={`cbtn${blobCopied ? ' ok' : ''}`} onClick={copyBlob}>
                {blobCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className={`obox${!encOut ? ' empty' : ''}`}>{encOut || '—'}</div>
            {encErr && <div className="err">{encErr}</div>}
          </div>
        </div>
      </div>

      {/* Payload stub */}
      {stub && (
        <div className="stub">
          <div className="stub-head">
            <div className="stub-name"><h2>Payload stub</h2></div>
            <div className="stub-controls">
              <div className="pills" id="stub-style-pills">
                {STUB_STYLES.map((s, i) => (
                  <button key={s} className={`pill${stubStyle === s ? ' active' : ''}`} onClick={() => setStubStyle(s)}>
                    {STUB_LABELS[i]}
                  </button>
                ))}
              </div>
              <div className="stub-div" />
              <div className="pills" id="stub-enc-pills">
                {OUT_FMTS.map((fmt, i) => (
                  <button key={fmt} className={`pill${stubFmt === fmt ? ' active' : ''}`} onClick={() => handleStubFmtChange(fmt)}>
                    {OUT_LABELS[i]}
                  </button>
                ))}
              </div>
              <button className={`cbtn${stubCopied ? ' ok' : ''}`} onClick={copyStub}>
                {stubCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="stub-warn">
            Runs the decoded payload via <code>eval()</code> / <code>new Function()</code>. For research and analysis only.
          </div>
          <div className="stub-code">{stubCode}</div>
        </div>
      )}
    </div>
  );
}
