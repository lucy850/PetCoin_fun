import { Award, Gamepad2, Heart, Home, PawPrint, ShoppingBag, Users, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../hooks/useGameStore';
import { ActiveView } from '../types/game';
import { sfx } from '../utils/sound';

interface NavbarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenMissions: () => void;
}

const NAV_ITEMS: { id: ActiveView; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'care', label: 'Rawat Pet', icon: Heart },
  { id: 'minigames', label: 'Mini Game', icon: Gamepad2 },
  { id: 'playground', label: 'Playground', icon: Users },
  { id: 'shop', label: 'Toko', icon: ShoppingBag },
];

export function Navbar({ activeView, onNavigate, onOpenMissions }: NavbarProps) {
  const { state, toggleMute, claimableCount } = useGameStore();

  const handleNav = (view: ActiveView) => {
    sfx.playPop();
    onNavigate(view);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-[#171713] bg-[#f5efdf]">
        <div className="max-w-[1240px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="flex items-center gap-1.5 sm:gap-2 font-display text-base sm:text-2xl font-extrabold tracking-tight text-[#171713] whitespace-nowrap shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center border-2 border-[#171713] bg-[#ffd86b] shadow-[2px_2px_0_#171713]">
              <PawPrint className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </span>
            <span>PETCOIN</span>
          </button>

          {/* Zone 2: 5 Clean Single-Line Nav Links */}
          <nav aria-label="Navigasi utama" className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map(item => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`text-sm font-bold whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-[#171713] text-[#171713]'
                      : 'border-transparent text-[#171713]/70 hover:text-[#171713] hover:border-[#171713]/40'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Dual Economy Balances + Audio + Misi Action */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div
              className="flex items-center gap-1 sm:gap-2 border-2 border-[#171713] bg-[#fffaf0] px-1.5 sm:px-2.5 py-1 shadow-[2px_2px_0_#171713]"
              title="Treat dari merawat pet (untuk adopsi hewan) & Coin dari mini game (untuk beli aksesori)"
            >
              <span className="font-mono-num text-[11px] sm:text-sm font-bold whitespace-nowrap">
                🍪 {state.treats}
              </span>
              <span className="text-[#171713]/30" aria-hidden="true">
                |
              </span>
              <span className="font-mono-num text-[11px] sm:text-sm font-bold whitespace-nowrap">
                🪙 {state.coins}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={state.muted ? 'Nyalakan suara' : 'Matikan suara'}
              title={state.muted ? 'Nyalakan suara' : 'Matikan suara'}
              className="neo-btn bg-[#fffaf0] w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0"
            >
              {state.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.playPop();
                onOpenMissions();
              }}
              aria-label={`Misi${claimableCount > 0 ? `, ${claimableCount} dapat diklaim` : ''}`}
              className="neo-btn bg-[#ffd86b] w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-xs sm:text-sm font-bold flex items-center justify-center sm:gap-1.5 whitespace-nowrap shrink-0"
            >
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Misi</span>
              {claimableCount > 0 && (
                <span className="font-mono-num bg-[#171713] text-[#ffd86b] text-[11px] px-1.5 py-0.2 leading-tight">
                  {claimableCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (compact <= 56px) */}
      <nav
        aria-label="Navigasi seluler"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#171713] bg-[#fffaf0] grid grid-cols-5 h-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]"
      >
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold whitespace-nowrap cursor-pointer ${
                isActive ? 'bg-[#ffd86b] text-[#171713]' : 'text-[#171713]/75'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
