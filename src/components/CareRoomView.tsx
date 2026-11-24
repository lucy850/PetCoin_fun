import { useEffect, useRef, useState } from 'react';
import {
  Bath,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Heart,
  Lightbulb,
  LightbulbOff,
  Shirt,
  ShoppingBag,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { FOODS, PET_BY_ID, PET_CATALOG, PLAY_TOOLS, pngUrl, xpNeededForLevel } from '../data/catalog';
import { getPetCondition, useGameStore } from '../hooks/useGameStore';
import { ActiveView, PetId, RoomId } from '../types/game';
import { sfx } from '../utils/sound';
import { PetAvatar } from './PetAvatar';

interface CareRoomViewProps {
  onNavigate: (view: ActiveView) => void;
}

const ROOMS: { id: RoomId; number: string; name: string; bg: string; icon: typeof Utensils }[] = [
  { id: 'kitchen', number: '01', name: 'Kitchen', bg: '#b9ecf0', icon: Utensils },
  { id: 'closet', number: '02', name: 'Closet & Play', bg: '#ffe7ee', icon: Shirt },
  { id: 'bathroom', number: '03', name: 'Bathroom', bg: '#c9f2f7', icon: Bath },
  { id: 'bedroom', number: '04', name: 'Bedroom', bg: '#e8dcff', icon: BedDouble },
];

export function CareRoomView({ onNavigate }: CareRoomViewProps) {
  const {
    state,
    activePet,
    activePetDef,
    petCombo,
    happyMoment,
    setActivePet,
    petThePet,
    feedPet,
    playWithPet,
    cleanPetStep,
    napPet,
    equipAccessory,
    showToast,
  } = useGameStore();

  const [roomIndex, setRoomIndex] = useState(0);
  const [squishKey, setSquishKey] = useState(0);
  const [roomHint, setRoomHint] = useState(`Elus ${activePetDef.name} atau pilih ruangan untuk merawatnya!`);

  // Bathroom interactive spa state
  const [isFoamed, setIsFoamed] = useState(false);
  const [showerOn, setShowerOn] = useState(false);
  const [isWet, setIsWet] = useState(false);
  const [dragTool, setDragTool] = useState<'soap' | 'towel' | null>(null);

  // Bedroom interactive state
  const [lampOn, setLampOn] = useState(true);
  const [isMasked, setIsMasked] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const petTargetRef = useRef<HTMLButtonElement | null>(null);
  const activeRoom = ROOMS[roomIndex];

  const isSleeping = activeRoom.id === 'bedroom' && !lampOn && isMasked;
  const condition = getPetCondition(state.activePetId, activePet.stats, happyMoment);
  const xpTarget = xpNeededForLevel(activePet.level);
  const equippedTool = PLAY_TOOLS.find(t => t.id === activePet.equipped.playTools);

  useEffect(() => {
    setRoomHint(`Elus ${activePetDef.name} atau mulai aktivitas di ${activeRoom.name}!`);
    if (activeRoom.id !== 'bathroom') {
      setShowerOn(false);
    }
    if (activeRoom.id !== 'bedroom') {
      setLampOn(true);
      setIsMasked(false);
    }
  }, [activeRoom.id, activeRoom.name, activePetDef.name, state.activePetId]);

  // Nap energy regeneration loop while sleeping
  useEffect(() => {
    if (!isSleeping) return;
    const interval = window.setInterval(() => {
      napPet(state.activePetId, 6, false);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isSleeping, state.activePetId, napPet]);

  const handlePetClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isSleeping) {
      setLampOn(true);
      setIsMasked(false);
      napPet(state.activePetId, 5, true, e.clientX, e.clientY);
      setSquishKey(k => k + 1);
      setRoomHint(`${activePetDef.name} bangun dengan penuh energi!`);
      return;
    }
    setSquishKey(k => k + 1);
    petThePet(state.activePetId, e.clientX, e.clientY);
    setRoomHint(`${activePetDef.name} senang banget dielus! Combo x${petCombo + 1}`);
  };

  const handleFeed = (foodId: string, foodName: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const ok = feedPet(state.activePetId, foodId, e.clientX, e.clientY);
    if (ok) {
      setSquishKey(k => k + 1);
      setRoomHint(`${foodName} lezat sekali! ${activePetDef.name} makin kenyang & memberi Treat.`);
    }
  };

  const handlePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    const ok = playWithPet(state.activePetId, e.clientX, e.clientY);
    if (ok) {
      setSquishKey(k => k + 1);
      setRoomHint(
        equippedTool
          ? `Asyik! ${activePetDef.name} seru bermain ${equippedTool.name}!`
          : `${activePetDef.name} melompat gembira bermain bersamamu!`,
      );
    }
  };

  const triggerSoap = (x?: number, y?: number) => {
    setIsFoamed(true);
    setIsWet(false);
    cleanPetStep(state.activePetId, 'soap', x, y);
    setRoomHint(`Sabun berbusa! Sekarang nyalakan Shower untuk membilas ${activePetDef.name}.`);
  };

  const toggleShower = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = !showerOn;
    if (next && !isFoamed && activePet.stats.clean < 95) {
      showToast('Tip: Sabuni dulu dengan SOAP sebelum menyalakan shower, atau bilas langsung!');
    }
    setShowerOn(next);
    if (next) {
      setIsFoamed(false);
      setIsWet(true);
      cleanPetStep(state.activePetId, 'rinse', e.clientX, e.clientY);
      setRoomHint(`Air shower membilas busa! Matikan shower lalu keringkan dengan Handuk.`);
    } else if (isWet) {
      setRoomHint(`Gunakan Handuk untuk mengeringkan ${activePetDef.name} & dapatkan +3 Treat!`);
    }
  };

  const triggerTowel = (x?: number, y?: number) => {
    if (!isWet && !isFoamed) {
      sfx.playPop();
      showToast(`Mandikan ${activePetDef.name} dengan Sabun & Shower dulu ya!`);
      return;
    }
    setShowerOn(false);
    setIsWet(false);
    setIsFoamed(false);
    setSquishKey(k => k + 1);
    cleanPetStep(state.activePetId, 'dry', x, y);
    setRoomHint(`${activePetDef.name} kering, wangi, dan kinclong! (+3 Treat 🍪)`);
  };

  const handleStagePointerDrop = (tool: 'soap' | 'towel', clientX: number, clientY: number) => {
    setDragTool(null);
    const target = petTargetRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const hit =
      clientX >= rect.left - 24 &&
      clientX <= rect.right + 24 &&
      clientY >= rect.top - 24 &&
      clientY <= rect.bottom + 24;
    if (hit) {
      if (tool === 'soap') triggerSoap(clientX, clientY);
      else triggerTowel(clientX, clientY);
    }
  };

  const toggleSleepMode = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isSleeping) {
      setLampOn(true);
      setIsMasked(false);
      napPet(state.activePetId, 8, true, e.clientX, e.clientY);
      setSquishKey(k => k + 1);
      setRoomHint(`${activePetDef.name} bangun segar bugar! (+2 Treat 🍪)`);
    } else {
      sfx.playSleep();
      setLampOn(false);
      setIsMasked(true);
      setRoomHint(`Lampu padam & penutup mata terpasang. Energi ${activePetDef.name} terisi...`);
    }
  };

  const statusTextFor = (label: string, val: number): string => {
    if (val <= 25) {
      if (label === 'Senang') return 'Sepi';
      if (label === 'Kenyang') return 'Lapar';
      if (label === 'Bersih') return 'Kotor';
      return 'Ngantuk';
    }
    if (val >= 80) return 'Optimal';
    return 'Baik';
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5 pb-24 md:pb-12">
      {/* Pet Switcher Strip */}
      <section aria-label="Pilih hewan peliharaan" className="flex items-center gap-2.5 overflow-x-auto pb-1">
        {PET_CATALOG.map(pet => {
          const owned = state.ownedPets.includes(pet.id);
          const isActive = state.activePetId === pet.id;
          const petSave = state.pets[pet.id];
          const needsAttention =
            owned &&
            (petSave.stats.happy <= 25 ||
              petSave.stats.hungry <= 25 ||
              petSave.stats.clean <= 28 ||
              petSave.stats.energy <= 25);

          return (
            <button
              key={pet.id}
              type="button"
              onClick={() => (owned ? setActivePet(pet.id as PetId) : onNavigate('shop'))}
              className={`neo-btn shrink-0 px-3 py-2 flex items-center gap-2.5 text-left ${
                isActive ? 'bg-[#ffd86b]' : owned ? 'bg-[#fffaf0]' : 'bg-[#f5efdf] opacity-75'
              }`}
            >
              <img
                src={pngUrl(pet.sprites.normal)}
                alt={pet.name}
                referrerPolicy="no-referrer"
                className={`w-8 h-8 object-contain ${owned ? '' : 'grayscale'}`}
              />
              <div className="leading-tight">
                <div className="text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5">
                  <span>{pet.name}</span>
                  {needsAttention && <span className="text-[#b91c1c] text-[10px]">!</span>}
                </div>
                <div className="font-mono-num text-[10px] font-semibold text-[#171713]/75 whitespace-nowrap">
                  {owned ? `LVL ${String(petSave.level).padStart(2, '0')}` : `🔒 ${pet.priceTreats} 🍪`}
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {/* Main Care Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center: Interactive 4-Room Pet Stage */}
        <section className="lg:col-span-7 neo-card p-4 sm:p-5 bg-[#fffaf0] space-y-4">
          {/* Room Header & Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono-num text-[11px] font-bold text-[#171713]/65">
                ROOM {activeRoom.number} / 04 · {activePetDef.speciesLabel}
              </div>
              <h1 className="flex items-center gap-2 font-display text-2xl sm:text-3xl font-extrabold">
                <activeRoom.icon className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" aria-hidden="true" />
                {activeRoom.name}
              </h1>
            </div>

            <div className="flex items-center gap-1.5">
              {ROOMS.map((r, idx) => {
                const Icon = r.icon;
                const active = idx === roomIndex;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      sfx.playPop();
                      setRoomIndex(idx);
                    }}
                    title={r.name}
                    aria-label={`Pindah ke ${r.name}`}
                    className={`neo-btn px-2.5 py-2 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
                      active ? 'bg-[#ffd86b]' : 'bg-[#f5efdf]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{r.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Stage Canvas */}
          <div
            ref={stageRef}
            className="relative h-[360px] sm:h-[420px] border-2 border-[#171713] overflow-hidden room-grid-bg transition-colors duration-300 flex flex-col items-center justify-center"
            style={{
              backgroundColor: activeRoom.id === 'bedroom' && !lampOn ? '#2d2846' : activeRoom.bg,
            }}
          >
            {/* Top Stage Bar */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <span className="bg-[#fffaf0] border-2 border-[#171713] px-2.5 py-1 text-xs font-extrabold shadow-[2px_2px_0_#171713]">
                {activePetDef.name} · LVL {String(activePet.level).padStart(2, '0')}
              </span>
              <span
                className={`border-2 border-[#171713] px-2.5 py-1 text-xs font-extrabold shadow-[2px_2px_0_#171713] ${
                  isSleeping
                    ? 'bg-[#d3b8ff]'
                    : condition.tone === 'alert'
                      ? 'bg-[#ff7f6b]'
                      : condition.tone === 'warn'
                        ? 'bg-[#ffd86b]'
                        : 'bg-[#8be084]'
                }`}
              >
                {isSleeping ? 'Sedang Tidur' : condition.label}
              </span>
            </div>

            {/* Room Specific Props */}
            {activeRoom.id === 'kitchen' && (
              <>
                <div
                  aria-hidden="true"
                  className="absolute left-6 top-16 w-24 h-24 border-2 border-[#171713] bg-gradient-to-b from-[#9be276] via-[#9be276] to-[#63be78] shadow-[3px_3px_0_#171713] hidden sm:block"
                >
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-[#171713]" />
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#171713]" />
                </div>
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 inset-x-0 h-16 border-t-3 border-[#171713] bg-[#f3aa63]"
                />
              </>
            )}

            {activeRoom.id === 'closet' && (
              <div
                aria-hidden="true"
                className="absolute bottom-0 inset-x-0 h-16 border-t-3 border-[#171713] bg-[#f7b5ca]"
              />
            )}

            {activeRoom.id === 'bathroom' && (
              <>
                {/* Shower Head & Toggle */}
                <div className="absolute top-14 right-5 z-10 flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={toggleShower}
                    className={`neo-btn px-3 py-1.5 font-mono-num text-xs font-extrabold ${
                      showerOn ? 'bg-[#8be084]' : 'bg-[#ff7f6b] text-[#171713]'
                    }`}
                  >
                    SHOWER: {showerOn ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Falling Shower Water */}
                {showerOn && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-[28%] top-12 bottom-16 z-20 overflow-hidden"
                  >
                    {[12, 26, 40, 54, 68, 82].map((leftPct, i) => (
                      <span
                        key={leftPct}
                        style={{ left: `${leftPct}%`, animationDelay: `${i * 90}ms` }}
                        className="animate-shower-drop absolute top-0 w-1 h-6 bg-[#2aa8c8] rounded-full"
                      />
                    ))}
                  </div>
                )}

                {/* Draggable / Clickable Soap & Towel inside stage */}
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDragTool('soap')}
                  onDragEnd={e => handleStagePointerDrop('soap', e.clientX, e.clientY)}
                  onClick={e => triggerSoap(e.clientX, e.clientY)}
                  className="neo-btn absolute bottom-4 left-4 z-20 bg-[#ffafd0] px-3 py-2 text-xs font-extrabold"
                >
                  🫧 SABUN
                </button>
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDragTool('towel')}
                  onDragEnd={e => handleStagePointerDrop('towel', e.clientX, e.clientY)}
                  onClick={e => triggerTowel(e.clientX, e.clientY)}
                  className="neo-btn absolute bottom-4 right-4 z-20 bg-[#fffaf0] px-3 py-2 text-xs font-extrabold"
                >
                  🧺 HANDUK
                </button>
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 inset-x-0 h-14 border-t-3 border-[#171713] bg-[#8ce3ed]"
                />
              </>
            )}

            {activeRoom.id === 'bedroom' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playPop();
                    setLampOn(v => !v);
                  }}
                  className={`neo-btn absolute top-14 right-4 z-10 px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 ${
                    lampOn ? 'bg-[#ffd86b]' : 'bg-[#d3b8ff]'
                  }`}
                >
                  {lampOn ? <Lightbulb className="w-4 h-4" /> : <LightbulbOff className="w-4 h-4" />}
                  <span>{lampOn ? 'Lampu ON' : 'Lampu OFF'}</span>
                </button>
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 inset-x-0 h-16 border-t-3 border-[#171713] bg-[#b99bf0]"
                />
              </>
            )}

            {/* Room Left/Right Arrows */}
            <button
              type="button"
              aria-label="Ruangan sebelumnya"
              onClick={() => {
                sfx.playPop();
                setRoomIndex(i => (i - 1 + ROOMS.length) % ROOMS.length);
              }}
              className="neo-btn absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-[#ffd86b] w-10 h-10 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Ruangan berikutnya"
              onClick={() => {
                sfx.playPop();
                setRoomIndex(i => (i + 1) % ROOMS.length);
              }}
              className="neo-btn absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-[#ff8fb3] w-10 h-10 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Interactive Pet Target */}
            <button
              ref={petTargetRef}
              type="button"
              onClick={handlePetClick}
              onDragOver={e => {
                if (dragTool) e.preventDefault();
              }}
              onDrop={e => {
                if (dragTool) {
                  e.preventDefault();
                  handleStagePointerDrop(dragTool, e.clientX, e.clientY);
                }
              }}
              aria-label={`Elus ${activePetDef.name}`}
              className="relative z-10 w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center cursor-pointer focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#171713]"
            >
              <PetAvatar
                petId={state.activePetId}
                mood={condition.mood}
                equipped={activePet.equipped}
                isDirty={activePet.stats.clean < 30}
                isFoamed={isFoamed}
                isWet={isWet}
                isMasked={isMasked}
                isSleeping={isSleeping}
                squishKey={squishKey}
                className="w-full h-full"
              />
            </button>
          </div>

          {/* Stage Footer Hint */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <span className="text-[#171713]/85">{roomHint}</span>
            {petCombo >= 2 && (
              <span className="font-mono-num bg-[#ffd86b] border border-[#171713] px-2 py-0.5 font-extrabold">
                Combo Elus x{petCombo} (tiap x3 = Treat!)
              </span>
            )}
          </div>
        </section>

        {/* Right Column: Unified 4-Bar Status + Room Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Status Panel */}
          <section className="neo-card p-5 bg-[#fffaf0] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#171713]/65">Status Hewan</p>
                <h2 className="font-display text-xl font-extrabold">
                  {activePetDef.name} · Level {activePet.level}
                </h2>
              </div>
              <button
                type="button"
                onClick={handlePetClick}
                className="neo-btn bg-[#ff8fb3] px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Elus</span>
              </button>
            </div>

            {/* 4 Unified Status Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {[
                { label: 'Senang', value: activePet.stats.happy, color: '#ff8fb3' },
                { label: 'Kenyang', value: activePet.stats.hungry, color: '#ffd86b' },
                { label: 'Bersih', value: activePet.stats.clean, color: '#7bd3ea' },
                { label: 'Energi', value: activePet.stats.energy, color: '#8be084' },
              ].map(meter => {
                const rounded = Math.round(meter.value);
                const statusWord = statusTextFor(meter.label, rounded);
                return (
                  <div key={meter.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{meter.label}</span>
                      <span className="font-mono-num">
                        {statusWord} · {rounded}%
                      </span>
                    </div>
                    <div className="h-3 bg-[#f5efdf] border-2 border-[#171713]">
                      <div
                        className="h-full transition-[width] duration-300"
                        style={{
                          width: `${rounded}%`,
                          backgroundColor: rounded <= 25 ? '#ff7f6b' : meter.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* XP & Perk Info */}
            <div className="pt-3 border-t-2 border-[#171713]/15 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Pengalaman (XP)</span>
                <span className="font-mono-num">
                  {activePet.xp} / {xpTarget} XP
                </span>
              </div>
              <div className="h-2.5 bg-[#f5efdf] border border-[#171713]">
                <div
                  className="h-full bg-[#171713] transition-[width] duration-300"
                  style={{ width: `${Math.min(100, Math.round((activePet.xp / xpTarget) * 100))}%` }}
                />
              </div>
              <p className="text-xs text-[#171713]/75 pt-1">
                <strong>Keunggulan:</strong> {activePetDef.perkLabel}
              </p>
              <p className="text-xs font-semibold text-[#171713]/85">{condition.note}</p>
            </div>
          </section>

          {/* Context-Sensitive Room Action Panel */}
          <section className="neo-card p-5 bg-[#fffaf0] space-y-4">
            {activeRoom.id === 'kitchen' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#171713]/65">Dapur Gratis</p>
                    <h3 className="font-display text-lg font-extrabold">Pilih Camilan (+Treat 🍪)</h3>
                  </div>
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {FOODS.map(food => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={e => handleFeed(food.id, food.name, e)}
                      className="neo-btn bg-[#f5efdf] p-2.5 flex items-center gap-2.5 text-left"
                    >
                      <img
                        src={pngUrl(food.image)}
                        alt={food.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 object-contain shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate">{food.name}</div>
                        <div className="font-mono-num text-[11px] font-bold text-[#171713]/75">
                          +{food.treatReward} 🍪
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeRoom.id === 'closet' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#171713]/65">Main &amp; Ganti Gaya</p>
                    <h3 className="font-display text-lg font-extrabold">Lemari &amp; Mainan</h3>
                  </div>
                  <Shirt className="w-5 h-5" />
                </div>

                <button
                  type="button"
                  onClick={handlePlay}
                  className="neo-btn w-full bg-[#8be084] py-3 px-4 text-sm font-extrabold flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{equippedTool ? equippedTool.actionLabel : `Ajak ${activePetDef.name} Main (+Treat 🍪)`}</span>
                </button>

                <div className="space-y-2.5 pt-1">
                  <div className="text-xs font-bold text-[#171713]/70">Item yang sudah kamu miliki:</div>
                  <div className="flex flex-wrap gap-2">
                    {activePet.inventory.hair.map(hId => {
                      const h = activePetDef.hairAssets.find(x => x.id === hId);
                      if (!h) return null;
                      const worn = activePet.equipped.hair === hId;
                      return (
                        <button
                          key={hId}
                          type="button"
                          onClick={() => equipAccessory(state.activePetId, 'hair', worn ? undefined : hId)}
                          className={`neo-btn px-2.5 py-1.5 text-xs font-bold ${
                            worn ? 'bg-[#ffd86b]' : 'bg-[#f5efdf]'
                          }`}
                        >
                          {h.name} {worn ? '✓' : ''}
                        </button>
                      );
                    })}
                    {activePet.inventory.accessories.map(aId => {
                      const a = activePetDef.accessoryAssets.find(x => x.id === aId);
                      if (!a) return null;
                      const worn = activePet.equipped.accessories === aId;
                      return (
                        <button
                          key={aId}
                          type="button"
                          onClick={() => equipAccessory(state.activePetId, 'accessories', worn ? undefined : aId)}
                          className={`neo-btn px-2.5 py-1.5 text-xs font-bold ${
                            worn ? 'bg-[#ff8fb3]' : 'bg-[#f5efdf]'
                          }`}
                        >
                          {a.name} {worn ? '✓' : ''}
                        </button>
                      );
                    })}
                    {activePet.inventory.playTools.map(tId => {
                      const t = PLAY_TOOLS.find(x => x.id === tId);
                      if (!t) return null;
                      const worn = activePet.equipped.playTools === tId;
                      return (
                        <button
                          key={tId}
                          type="button"
                          onClick={() => equipAccessory(state.activePetId, 'playTools', worn ? undefined : tId)}
                          className={`neo-btn px-2.5 py-1.5 text-xs font-bold ${
                            worn ? 'bg-[#7bd3ea]' : 'bg-[#f5efdf]'
                          }`}
                        >
                          {t.name} {worn ? '✓' : ''}
                        </button>
                      );
                    })}
                    {activePet.inventory.hair.length +
                      activePet.inventory.accessories.length +
                      activePet.inventory.playTools.length ===
                      0 && (
                      <p className="text-xs text-[#171713]/70">
                        Belum ada aksesori untuk {activePetDef.name}. Kumpulkan Coin di Mini Game lalu belanja di Toko!
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playPop();
                      onNavigate('shop');
                    }}
                    className="neo-btn bg-[#ffd86b] px-4 py-2 text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Beli Rambut &amp; Aksesori pakai Coin 🪙</span>
                  </button>
                </div>
              </>
            )}

            {activeRoom.id === 'bathroom' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#171713]/65">Mandi Busa 3 Langkah</p>
                    <h3 className="font-display text-lg font-extrabold">Spa Bathroom (+3 Treat 🍪)</h3>
                  </div>
                  <Bath className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#171713]/80">
                  Klik atau seret Sabun ke pet, bilas pakai Shower, lalu keringkan dengan Handuk untuk panen Treat!
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={e => triggerSoap(e.clientX, e.clientY)}
                    className={`neo-btn py-2.5 px-2 text-xs font-extrabold ${
                      isFoamed ? 'bg-[#8be084]' : 'bg-[#ffafd0]'
                    }`}
                  >
                    1. Sabun
                  </button>
                  <button
                    type="button"
                    onClick={toggleShower}
                    className={`neo-btn py-2.5 px-2 text-xs font-extrabold ${
                      showerOn || isWet ? 'bg-[#8be084]' : 'bg-[#7bd3ea]'
                    }`}
                  >
                    2. Shower
                  </button>
                  <button
                    type="button"
                    onClick={e => triggerTowel(e.clientX, e.clientY)}
                    className="neo-btn bg-[#ffd86b] py-2.5 px-2 text-xs font-extrabold"
                  >
                    3. Handuk
                  </button>
                </div>
              </>
            )}

            {activeRoom.id === 'bedroom' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#171713]/65">Istirahat &amp; Energi</p>
                    <h3 className="font-display text-lg font-extrabold">Kamar Tidur (+2 Treat 🍪)</h3>
                  </div>
                  <BedDouble className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#171713]/80">
                  Matikan lampu dan pasang penutup mata agar energi {activePetDef.name} pulih dengan cepat.
                </p>
                <button
                  type="button"
                  onClick={toggleSleepMode}
                  className={`neo-btn w-full py-3 px-4 text-sm font-extrabold ${
                    isSleeping ? 'bg-[#ffd86b]' : 'bg-[#d3b8ff]'
                  }`}
                >
                  {isSleeping ? 'Bangunkan Pet (+2 Treat 🍪)' : 'Tidurkan Pet Sekarang 😴'}
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
