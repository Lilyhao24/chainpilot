import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext.jsx';

function AppContent() {
  const { lang, t, toggleLang } = useLanguage();
  // Persist scan history in localStorage
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('chainpilot_scan_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [scanCount, setScanCount] = useState(() => {
    try { return parseInt(localStorage.getItem('chainpilot_scan_count') || '0'); } catch { return 0; }
  });
  const [blockCount, setBlockCount] = useState(() => {
    try { return parseInt(localStorage.getItem('chainpilot_block_count') || '0'); } catch { return 0; }
  });
  const [lastScan, setLastScan] = useState(() => {
    try {
      const saved = localStorage.getItem('chainpilot_last_scan');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  function handleScanComplete(safetyScore) {
    setLastScan(safetyScore);
    setScanCount((c) => {
      const next = c + 1;
      localStorage.setItem('chainpilot_scan_count', String(next));
      return next;
    });
    if (safetyScore.grade === 'F') {
      setBlockCount((c) => {
        const next = c + 1;
        localStorage.setItem('chainpilot_block_count', String(next));
        return next;
      });
    }
    const entry = {
      total: safetyScore.total, grade: safetyScore.grade, symbol: safetyScore.symbol || '??',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    setScanHistory((prev) => {
      const next = [entry, ...prev.slice(0, 19)];
      localStorage.setItem('chainpilot_scan_history', JSON.stringify(next));
      return next;
    });
    localStorage.setItem('chainpilot_last_scan', JSON.stringify(safetyScore));
  }

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] shrink-0 bg-[#0D0D0D]">
        <div className="flex items-center gap-6">
          <h1 className="font-display text-4xl text-glow-red" style={{ color: '#ff1744' }}>
            CHAINPILOT
          </h1>
          <div className="hidden md:flex flex-col">
            <span className="font-display text-lg text-gray-300">
              {t.tagline}
            </span>
            <div className="flex items-center gap-3 mt-1 text-[10px] font-mechanical tracking-wider text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-glow" style={{ color: '#22c55e' }} />
                {t.realtime}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                {t.precision}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {t.safety}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLang}
            className="font-mechanical text-xs tracking-wider px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all bg-white/[0.03]"
          >
            {lang === 'zh' ? '中' : 'EN'}
          </button>
          <ConnectButton />
        </div>
      </header>

      {/* Main: Left Dashboard + Right Chat */}
      <div className="flex flex-1 overflow-hidden">
        <Dashboard
          lastScan={lastScan}
          scanCount={scanCount}
          blockCount={blockCount}
          scanHistory={scanHistory}
        />
        <Chat onScanComplete={handleScanComplete} />
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
