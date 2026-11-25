import { useEffect, useState } from 'react';
import { CareRoomView } from './components/CareRoomView';
import { HomeView } from './components/HomeView';
import { JuiceOverlay } from './components/JuiceOverlay';
import { MiniGamesView } from './components/MiniGamesView';
import { Navbar } from './components/Navbar';
import { PlaygroundView } from './components/PlaygroundView';
import { ProgressionModal } from './components/ProgressionModal';
import { ShopView } from './components/ShopView';
import { GameProvider } from './hooks/useGameStore';
import { ActiveView } from './types/game';

const VIEW_METADATA: Record<ActiveView, { title: string; description: string }> = {
  home: {
    title: 'PetCoin — Game Hewan Virtual, Mini Game & Adopsi Pet',
    description:
      'Mainkan PetCoin, game hewan virtual: rawat dan adopsi 5 pet lucu, kumpulkan Treat, dapatkan Coin lewat 3 mini game, lalu lengkapi koleksi aksesori.',
  },
  care: {
    title: 'Rawat Pet Virtual — PetCoin',
    description:
      'Rawat pet virtual di PetCoin: beri makan, bermain, mandi, dan bantu hewan kesayanganmu beristirahat di ruangan interaktif.',
  },
  minigames: {
    title: 'Mini Game PetCoin — Kumpulkan Coin',
    description:
      'Mainkan Tangkap Koin, Cocokkan Kartu, dan Lempar Tangkap bersama pet untuk mengumpulkan Coin di PetCoin.',
  },
  playground: {
    title: 'Playground Multiplayer PetCoin',
    description:
      'Bermain bersama pemain lain di PetCoin Playground. Ajak pet berjalan, bermain bola, mengirim emote, dan mengobrol real-time.',
  },
  shop: {
    title: 'Toko PetCoin — Adopsi Pet & Aksesori',
    description:
      'Jelajahi toko PetCoin untuk mengadopsi 5 pet virtual dan memilih gaya rambut, aksesori, serta mainan untuk hewan kesayanganmu.',
  },
};

function AppShell() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [missionsOpen, setMissionsOpen] = useState(false);

  useEffect(() => {
    const metadata = VIEW_METADATA[activeView];
    document.title = metadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', metadata.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', metadata.description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', metadata.title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', metadata.description);
  }, [activeView]);

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
        {activeView === 'playground' && <PlaygroundView />}
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
