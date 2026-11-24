import { useState } from 'react';
import { CareRoomView } from './components/CareRoomView';
import { HomeView } from './components/HomeView';
import { JuiceOverlay } from './components/JuiceOverlay';
import { MiniGamesView } from './components/MiniGamesView';
import { Navbar } from './components/Navbar';
import { ProgressionModal } from './components/ProgressionModal';
import { ShopView } from './components/ShopView';
import { GameProvider } from './hooks/useGameStore';
import { ActiveView } from './types/game';

function AppShell() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [missionsOpen, setMissionsOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5efdf] text-[#171713]">
      <Navbar
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenMissions={() => setMissionsOpen(true)}
      />

      <main className="flex-1">
        {activeView === 'home' && (
          <HomeView onNavigate={setActiveView} onOpenMissions={() => setMissionsOpen(true)} />
        )}
        {activeView === 'care' && <CareRoomView onNavigate={setActiveView} />}
        {activeView === 'minigames' && <MiniGamesView />}
        {activeView === 'shop' && <ShopView onNavigate={setActiveView} />}
      </main>

      <footer className="hidden md:block border-t-2 border-[#171713] bg-[#fffaf0]">
        <div className="max-w-[1240px] mx-auto px-6 py-4 flex items-center justify-between text-xs font-semibold text-[#171713]/75">
          <span>PetCoin · Rawat hewanmu, mainkan mini game, lengkapi semua koleksi.</span>
          <span>Treat 🍪 untuk Adopsi · Coin 🪙 untuk Aksesori</span>
        </div>
      </footer>

      <ProgressionModal open={missionsOpen} onClose={() => setMissionsOpen(false)} />
      <JuiceOverlay />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}
