import React, { useState, useEffect } from 'react';
import EncodeTab from './components/EncodeTab';
import DecodeTab from './components/DecodeTab';
import AnalyzeTab from './components/AnalyzeTab';

const TABS = ['encode', 'decode', 'analyze'];

export default function App() {
  const [tab, setTab] = useState('encode');
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('xor-theme') === 'dark'; } catch (_) { return false; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem('xor-theme', dark ? 'dark' : 'light'); } catch (_) {}
  }, [dark]);

  return (
    <div className="wrap">
      <header>
        <h1>XOR tool</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div className="modes">
            {TABS.map(t => (
              <button
                key={t}
                className={`mode${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="theme-toggle has-tooltip"
            data-tooltip={dark ? 'Light mode' : 'Dark mode'}
            onClick={() => setDark(d => !d)}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? '☀︎' : '☽'}
          </button>
        </div>
      </header>

      {tab === 'encode'  && <EncodeTab />}
      {tab === 'decode'  && <DecodeTab />}
      {tab === 'analyze' && <AnalyzeTab />}

      <footer className="site-footer">
        <div className="footer-col">
          <div className="footer-heading">About XOR encryption</div>
          <p>XOR flips each plaintext bit against a key bit. Encryption and decryption are the same operation. A key that is random and never reused is a one-time pad — unbreakable. A short repeating key is trivially broken by frequency analysis or a known-plaintext attack.</p>
        </div>
        <div className="footer-col">
          <div className="footer-heading">Usage &amp; legal</div>
          <p>For malware analysis, reverse engineering, and CTF research. The stubs generated here call <code>eval()</code> and should not leave a sandboxed environment. Do not use against systems you don't own.</p>
        </div>
      </footer>
    </div>
  );
}
