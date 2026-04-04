import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';

function App() {
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
        <h1 className="font-mechanical text-2xl font-bold tracking-[0.3em] text-glow-red" style={{ color: '#ff1744' }}>
          CHAINPILOT
        </h1>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex flex-col items-center">
            <span className="font-mechanical text-sm tracking-[0.4em] text-gray-400 font-medium">
              SAFE DEFI AGENT
            </span>
            <div className="flex items-center gap-4 mt-1 text-[9px] font-mechanical tracking-wider text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-glow" style={{ color: '#22c55e' }} />
                REAL-TIME
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                PRECISION
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                SAFETY
              </span>
            </div>
          </div>
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

export default App;
