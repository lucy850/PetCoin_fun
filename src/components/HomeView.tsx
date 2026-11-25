import { useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, Gamepad2, Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { DAILY_STREAK_REWARDS, PET_CATALOG, pngUrl, xpNeededForLevel } from '../data/catalog';
import { getPetCondition, useGameStore } from '../hooks/useGameStore';
import { ActiveView, PetId } from '../types/game';
import { sfx } from '../utils/sound';
import { PetAvatar } from './PetAvatar';

interface HomeViewProps {
  onNavigate: (view: ActiveView) => void;
  onOpenMissions: () => void;
}

export function HomeView({ onNavigate, onOpenMissions }: HomeViewProps) {
  const {
    state,
    activePet,
    activePetDef,
    happyMoment,
    petThePet,
    setActivePet,
    claimDailyCheckIn,
  } = useGameStore();
  const [squishKey, setSquishKey] = useState(0);

  const condition = getPetCondition(state.activePetId, activePet.stats, happyMoment);
  const xpTarget = xpNeededForLevel(activePet.level);
  const todayReward = DAILY_STREAK_REWARDS[state.daily.streakDay - 1] || DAILY_STREAK_REWARDS[0];

  const handleHeroPetTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    setSquishKey(k => k + 1);
    petThePet(state.activePetId, e.clientX, e.clientY);
  };

  const handleSelectFriend = (petId: PetId) => {
    sfx.playPop();
    if (state.ownedPets.includes(petId)) {
      setActivePet(petId);
      onNavigate('care');
    } else {
      onNavigate('shop');
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10 pb-24 md:pb-12">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 neo-card p-6 sm:p-8 flex flex-col justify-between bg-[#fffaf0]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#171713]/75">
              <span>PetCoin Virtual Club</span>
              <span aria-hidden="true">·</span>
              <span>Koleksi {state.ownedPets.length} / {PET_CATALOG.length} Hewan</span>
              <span aria-hidden="true">·</span>
              <span>Hari Ke-{state.daily.streakDay}</span>
            </div>

            <h1 className="flex items-start gap-2 font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-[#171713]">
              <Sparkles className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 mt-1 text-[#b77d00]" aria-hidden="true" />
              <span>Rawat pet lucumu. Kumpulkan Treat &amp; Coin!</span>
            </h1>

            <p className="text-sm sm:text-base text-[#171713]/80 max-w-xl leading-relaxed">
              Pelihara teman virtualmu untuk mendapatkan <strong>Treat 🍪</strong> guna mengadopsi hewan baru, lalu mainkan mini-game seru untuk mengumpulkan <strong>Coin 🪙</strong> demi membeli gaya dan mainan keren.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sfx.playPop();
                  onNavigate('care');
                }}
                className="neo-btn bg-[#ffd86b] px-5 py-3 text-sm sm:text-base font-extrabold flex items-center gap-2 whitespace-nowrap"
              >
                <Heart className="w-4 h-4" />
                <span>Rawat {activePetDef.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playPop();
                  onNavigate('minigames');
                }}
                className="neo-btn bg-[#7bd3ea] px-5 py-3 text-sm sm:text-base font-extrabold flex items-center gap-2 whitespace-nowrap"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Main Mini Game</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playPop();
                  onNavigate('playground');
                }}
                className="neo-btn bg-[#ff8fb3] px-5 py-3 text-sm sm:text-base font-extrabold flex items-center gap-2 whitespace-nowrap"
              >
                <span>Playground Online</span>
              </button>
            </div>
          </div>

          {/* Easy-to-learn Onboarding / Daily Strip */}
          <div className="mt-7 pt-5 border-t-2 border-[#171713]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-[#171713]/70">Panduan Cepat Pemula</div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  {state.onboardingSteps.petted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#1d7a2d]" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#171713]/40" />
                  )}
                  Elus / beri makan pet
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {state.onboardingSteps.playedMiniGame ? (
                    <CheckCircle2 className="w-4 h-4 text-[#1d7a2d]" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#171713]/40" />
                  )}
                  Main 1x mini game
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {state.onboardingSteps.visitedShop ? (
                    <CheckCircle2 className="w-4 h-4 text-[#1d7a2d]" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#171713]/40" />
                  )}
                  Cek Toko Adopsi &amp; Gaya
                </span>
              </div>
            </div>

            {!state.daily.checkedInToday ? (
              <button
                type="button"
                onClick={claimDailyCheckIn}
                className="neo-btn bg-[#8be084] px-3.5 py-2 text-xs font-extrabold whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Klaim Bonus Harian (+{todayReward.treats} 🍪 +{todayReward.coins} 🪙)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenMissions}
                className="neo-btn bg-[#fffaf0] px-3.5 py-2 text-xs font-bold whitespace-nowrap shrink-0"
              >
                Lihat Misi Harian
              </button>
            )}
          </div>
        </div>

        {/* Hero Interactive Pet Stage */}
        <div
          className="lg:col-span-5 neo-card p-5 sm:p-6 flex flex-col justify-between room-grid-bg"
          style={{ backgroundColor: activePetDef.cardBg }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold bg-[#fffaf0] border-2 border-[#171713] px-2.5 py-1 shadow-[2px_2px_0_#171713]">
              {activePetDef.name} · LVL <span className="font-mono-num">{String(activePet.level).padStart(2, '0')}</span>
            </div>
            <div
              className={`text-xs font-bold border-2 border-[#171713] px-2.5 py-1 shadow-[2px_2px_0_#171713] ${
                condition.tone === 'alert'
                  ? 'bg-[#ff7f6b]'
                  : condition.tone === 'warn'
                    ? 'bg-[#ffd86b]'
                    : 'bg-[#8be084]'
              }`}
            >
              {condition.label}
            </div>
          </div>

          <button
            type="button"
            onClick={handleHeroPetTap}
            aria-label={`Elus ${activePetDef.name}`}
            className="group relative my-3 flex-1 min-h-[220px] flex flex-col items-center justify-center cursor-pointer focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#171713]"
          >
            <PetAvatar
              petId={state.activePetId}
              mood={condition.mood}
              equipped={activePet.equipped}
              isDirty={activePet.stats.clean < 30}
              squishKey={squishKey}
              className="w-48 h-48 sm:w-56 sm:h-56 transition-transform group-hover:scale-105"
            />
            <span className="mt-2 bg-[#171713] text-[#fffaf0] px-3 py-1 text-xs font-bold">
              Tap {activePetDef.name} untuk elus (+Senang &amp; Treat)
            </span>
          </button>

          {/* Compact 4-stat preview */}
          <div className="bg-[#fffaf0] border-2 border-[#171713] p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <div className="flex justify-between font-bold mb-0.5">
                <span>Senang</span>
                <span className="font-mono-num">{Math.round(activePet.stats.happy)}%</span>
              </div>
              <div className="h-2 bg-[#f5efdf] border border-[#171713]">
                <div className="h-full bg-[#ff8fb3]" style={{ width: `${activePet.stats.happy}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold mb-0.5">
                <span>Kenyang</span>
                <span className="font-mono-num">{Math.round(activePet.stats.hungry)}%</span>
              </div>
              <div className="h-2 bg-[#f5efdf] border border-[#171713]">
                <div className="h-full bg-[#ffd86b]" style={{ width: `${activePet.stats.hungry}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold mb-0.5">
                <span>Bersih</span>
                <span className="font-mono-num">{Math.round(activePet.stats.clean)}%</span>
              </div>
              <div className="h-2 bg-[#f5efdf] border border-[#171713]">
                <div className="h-full bg-[#7bd3ea]" style={{ width: `${activePet.stats.clean}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold mb-0.5">
                <span>Energi</span>
                <span className="font-mono-num">{Math.round(activePet.stats.energy)}%</span>
              </div>
              <div className="h-2 bg-[#f5efdf] border border-[#171713]">
                <div className="h-full bg-[#8be084]" style={{ width: `${activePet.stats.energy}%` }} />
              </div>
            </div>
            <div className="col-span-2 pt-1 flex items-center justify-between text-[11px] font-semibold text-[#171713]/75">
              <span>XP Level {activePet.level}</span>
              <span className="font-mono-num">
                {activePet.xp} / {xpTarget} XP
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Economy Loop Clarity */}
      <section aria-labelledby="economy-title" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-[#171713]/65">Cara Kerja Ekonomi PetCoin</p>
            <h2 id="economy-title" className="font-display text-2xl sm:text-3xl font-extrabold">
              2 Mata Uang, 1 Siklus Seru
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#171713]/70">
            Mudah dipelajari dalam 30 detik
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="neo-card p-5 bg-[#ffe28a] flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <div className="font-mono-num text-xs font-bold">01 · RAWAT HEWAN</div>
              <h3 className="font-display text-xl font-extrabold">Pelihara Pet → Dapat Treat 🍪</h3>
              <p className="text-sm text-[#171713]/85">
                Elus pet, beri camilan di Kitchen, mandikan dengan sabun &amp; handuk, dan tidurkan saat lelah untuk panen Treat.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sfx.playPop();
                onNavigate('care');
              }}
              className="neo-btn bg-[#fffaf0] px-3.5 py-2 text-xs font-extrabold self-start"
            >
              Masuk Ruang Rawat →
            </button>
          </div>

          <div className="neo-card p-5 bg-[#7bd3ea] flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <div className="font-mono-num text-xs font-bold">02 · MINI GAME ARCADE</div>
              <h3 className="font-display text-xl font-extrabold">Main Game → Dapat Coin 🪙</h3>
              <p className="text-sm text-[#171713]/85">
                Mainkan 3 mini game cepat (Tangkap Koin, Cocokkan Kartu, Lempar Tangkap) dan kumpulkan Coin sebanyak mungkin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sfx.playPop();
                onNavigate('minigames');
              }}
              className="neo-btn bg-[#fffaf0] px-3.5 py-2 text-xs font-extrabold self-start"
            >
              Buka Mini Game →
            </button>
          </div>

          <div className="neo-card p-5 bg-[#ffc7da] flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <div className="font-mono-num text-xs font-bold">03 · TOKO &amp; KOLEKSI</div>
              <h3 className="font-display text-xl font-extrabold">Treat untuk Adopsi, Coin untuk Gaya</h3>
              <p className="text-sm text-[#171713]/85">
                Gunakan <strong>Treat 🍪</strong> untuk mengadopsi 5 pet unik dan gunakan <strong>Coin 🪙</strong> untuk membeli rambut, topi, syal, serta mainan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sfx.playPop();
                onNavigate('shop');
              }}
              className="neo-btn bg-[#fffaf0] px-3.5 py-2 text-xs font-extrabold self-start flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Kunjungi Toko →</span>
            </button>
          </div>
        </div>
      </section>

      {/* All 5 Pets Showcase */}
      <section aria-labelledby="pets-showcase-title" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#171713]/65">Daftar Teman PetCoin</p>
            <h2 id="pets-showcase-title" className="font-display text-2xl sm:text-3xl font-extrabold">
              Siapa yang ingin kamu rawat?
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.playPop();
              onNavigate('shop');
            }}
            className="text-sm font-bold underline underline-offset-4 hover:opacity-70 cursor-pointer whitespace-nowrap"
          >
            Buka Toko Adopsi →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {PET_CATALOG.map(pet => {
            const owned = state.ownedPets.includes(pet.id);
            const save = state.pets[pet.id];
            return (
              <button
                key={pet.id}
                type="button"
                onClick={() => handleSelectFriend(pet.id)}
                className="neo-card p-4 text-left flex flex-col justify-between transition-transform hover:-translate-y-1 cursor-pointer"
                style={{ backgroundColor: pet.cardBg }}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                    <span>{pet.rarity}</span>
                    {owned && <span className="font-mono-num">LVL {String(save.level).padStart(2, '0')}</span>}
                  </div>
                  <div className="h-28 flex items-center justify-center my-2">
                    <img
                      src={pngUrl(pet.sprites.normal)}
                      alt={pet.name}
                      referrerPolicy="no-referrer"
                      className={`max-h-full object-contain drop-shadow-[3px_3px_0_rgba(23,23,19,0.28)] ${
                        owned ? '' : 'grayscale-[25%] opacity-90'
                      }`}
                    />
                  </div>
                  <h3 className="font-display text-lg font-extrabold">{pet.name}</h3>
                  <p className="text-xs text-[#171713]/80 line-clamp-2">{pet.tagline}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#171713]/20 flex items-center justify-between text-xs font-extrabold">
                  {owned ? (
                    <span className="text-[#171713]">Dimiliki · Rawat →</span>
                  ) : (
                    <span className="font-mono-num">Adopsi · 🍪 {pet.priceTreats}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
