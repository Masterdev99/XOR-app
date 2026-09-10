import React, { useState } from 'react';
import EncodeTab from './components/EncodeTab';
import DecodeTab from './components/DecodeTab';
import AnalyzeTab from './components/AnalyzeTab';

const TABS = ['encode', 'decode', 'analyze'];

export default function App() {
  const [tab, setTab] = useState('encode');

  return (
    <div className="wrap">
      <header>
        <h1>XOR tool</h1>
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
      </header>

      {tab === 'encode'  && <EncodeTab />}
      {tab === 'decode'  && <DecodeTab />}
      {tab === 'analyze' && <AnalyzeTab />}
    </div>
  );
}
