import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext.jsx';

function AppContent() {
  const { lang, t, toggleLang } = useLanguage();
  const [lastScan, setLastScan] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [blockCount, setBlockCount] = useState(0);
  const [scanHistory, setScanHistory] = useState([]);

  function handleScanComplete(safetyScore) {
    setLastScan(safetyScore);
    setScanCount((c) => c + 1);
    if (safetyScore.grade === 'F') {
      setBlockCount((c) => c + 1);
    }
    setScanHistory((prev) => [
      {
        total: safetyScore.total, grade: safetyScore.grade, symbol: safetyScore.symbol || '??',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 19), // Keep last 20
    ]);
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
