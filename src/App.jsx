import { ConnectButton } from '@rainbow-me/rainbowkit'

function App() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-wider">CHAINPILOT</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">SAFE DEFI AGENT</span>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content - Placeholder */}
      <main className="flex items-center justify-center h-[calc(100vh-72px)]">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">ChainPilot</h2>
          <p className="text-gray-400 mb-8">Safe DeFi Agent — Phase 1 Complete</p>
          <ConnectButton />
        </div>
      </main>
    </div>
  )
}

export default App
