import { useCallback, useEffect, useRef, useState } from 'react';
import { Flame, Gamepad2, Grid2X2, RotateCcw, Sparkles, Timer, Trophy, Zap } from 'lucide-react';
import { PET_CATALOG, pngUrl } from '../data/catalog';
import { useGameStore } from '../hooks/useGameStore';
import { sfx } from '../utils/sound';
import { PetAvatar } from './PetAvatar';

type GameTab = 'catch' | 'memory' | 'rhythm';
type PlayPhase = 'MENU' | 'PLAYING' | 'SUMMARY';

interface SpawnedTarget {
  id: number;
  x: number;
  y: number;
  kind: 'coin' | 'star' | 'mud';
}

interface MemoryCard {
  uid: number;
  pairId: string;
  label: string;
  image: string;
  flipped: boolean;
  matched: boolean;
}

const MEMORY_POOL = [
  { pairId: 'cat', label: 'Mochi', image: 'kucing123.png' },
  { pairId: 'elephant', label: 'Gajah', image: 'gajah 1.png' },
  { pairId: 'bear', label: 'Barnaby', image: 'Bear 1.png' },
  { pairId: 'rabbit', label: 'Boba', image: 'kelinci.png' },
  { pairId: 'chicken', label: 'Chiki', image: 'Ayam.png' },
  { pairId: 'coin', label: 'Koin', image: 'coin.png' },
];

export function MiniGamesView() {
  const { state, activePet, activePetDef, recordMiniGameResult, spawnJuice } = useGameStore();
  const [activeGame, setActiveGame] = useState<GameTab>('catch');
  const [phase, setPhase] = useState<PlayPhase>('MENU');
  const [lastResult, setLastResult] = useState<{ score: number; coins: number; bonus: number; label: string } | null>(
    null,
  );

  // --- GAME 1: COIN CATCH ---
  const [catchTime, setCatchTime] = useState(25);
  const [catchScore, setCatchScore] = useState(0);
  const [catchCoins, setCatchCoins] = useState(0);
  const [catchCombo, setCatchCombo] = useState(0);
  const [targets, setTargets] = useState<SpawnedTarget[]>([]);
  const [shakeArena, setShakeArena] = useState(false);

  const catchScoreRef = useRef(0);
  const catchCoinsRef = useRef(0);
  const catchComboRef = useRef(0);
  const targetIdRef = useRef(1);

  // --- GAME 2: MEMORY MATCH ---
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatches, setMemoryMatches] = useState(0);
  const [memorySeconds, setMemorySeconds] = useState(0);
  const lockBoardRef = useRef(false);

  // --- GAME 3: RHYTHM BOUNCE ---
  const [rhythmRound, setRhythmRound] = useState(1);
  const [rhythmMisses, setRhythmMisses] = useState(0);
  const [rhythmCoins, setRhythmCoins] = useState(0);
  const [rhythmScore, setRhythmScore] = useState(0);
  const [rhythmStreak, setRhythmStreak] = useState(0);
  const [rhythmFeedback, setRhythmFeedback] = useState('Tekan KETUK atau Spasi saat penanda masuk zona hijau/emas!');
  const [markerPos, setMarkerPos] = useState(10);
  const [zoneStart, setZoneStart] = useState(38);
  const [zoneWidth, setZoneWidth] = useState(22);

  const markerRef = useRef(10);
  const dirRef = useRef(1);
  const rhythmRoundRef = useRef(1);
  const rhythmMissesRef = useRef(0);
  const rhythmCoinsRef = useRef(0);
  const rhythmScoreRef = useRef(0);
  const rhythmStreakRef = useRef(0);

  const switchGame = (tab: GameTab) => {
    sfx.playPop();
    setActiveGame(tab);
    setPhase('MENU');
    setLastResult(null);
  };

  // Start Coin Catch
  const startCatch = () => {
    sfx.playPop();
    catchScoreRef.current = 0;
    catchCoinsRef.current = 0;
    catchComboRef.current = 0;
    setCatchScore(0);
    setCatchCoins(0);
    setCatchCombo(0);
    setCatchTime(25);
    setTargets([]);
    setLastResult(null);
    setPhase('PLAYING');
  };

  // Coin Catch loop
  useEffect(() => {
    if (activeGame !== 'catch' || phase !== 'PLAYING') return;

    const spawnOne = () => {
      const roll = Math.random();
      const kind: SpawnedTarget['kind'] = roll < 0.16 ? 'mud' : roll < 0.34 ? 'star' : 'coin';
      const id = targetIdRef.current++;
      const x = 8 + Math.random() * 82;
      const y = 12 + Math.random() * 72;

      setTargets(prev => [...prev.slice(-9), { id, x, y, kind }]);
      window.setTimeout(() => {
        setTargets(prev => prev.filter(t => t.id !== id));
      }, 1350);
    };

    spawnOne();
    const spawnTimer = window.setInterval(spawnOne, 520);
    const countdown = window.setInterval(() => {
      setCatchTime(prev => {
        if (prev <= 1) {
          window.clearInterval(spawnTimer);
          window.clearInterval(countdown);
          const finalCoins = Math.max(8, catchCoinsRef.current);
          const res = recordMiniGameResult('catch', catchScoreRef.current, finalCoins);
          setLastResult({
            score: catchScoreRef.current,
            coins: res.coinsEarned,
            bonus: res.bonusCoins,
            label: `${catchScoreRef.current} target tertangkap`,
          });
          setPhase('SUMMARY');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(spawnTimer);
      window.clearInterval(countdown);
    };
  }, [activeGame, phase, recordMiniGameResult]);

  const hitTarget = (target: SpawnedTarget, e: React.MouseEvent<HTMLButtonElement>) => {
    setTargets(prev => prev.filter(t => t.id !== target.id));

    if (target.kind === 'mud') {
      sfx.playBad();
      catchComboRef.current = 0;
      setCatchCombo(0);
      setShakeArena(true);
      window.setTimeout(() => setShakeArena(false), 300);
      spawnJuice(e.clientX, e.clientY, 'Ups! Combo Reset', 'bad');
      return;
    }

    const nextCombo = catchComboRef.current + 1;
    catchComboRef.current = nextCombo;
    setCatchCombo(nextCombo);

    const mult = nextCombo >= 8 ? 3 : nextCombo >= 4 ? 2 : 1;
    const baseCoin = target.kind === 'star' ? 4 : 2;
    const gained = baseCoin * mult;

    catchScoreRef.current += 1;
    catchCoinsRef.current += gained;
    setCatchScore(catchScoreRef.current);
    setCatchCoins(catchCoinsRef.current);

    if (target.kind === 'star') sfx.playStarCoin();
    else sfx.playCoin(nextCombo);

    spawnJuice(e.clientX, e.clientY, `+${gained} 🪙${mult > 1 ? ` (x${mult})` : ''}`, 'coin');
  };

  // Start Memory Match
  const startMemory = () => {
    sfx.playPop();
    const deck = [...MEMORY_POOL, ...MEMORY_POOL]
      .sort(() => Math.random() - 0.5)
      .map((item, idx) => ({
        uid: idx + 1,
        pairId: item.pairId,
        label: item.label,
        image: item.image,
        flipped: false,
        matched: false,
      }));
    lockBoardRef.current = false;
    setCards(deck);
    setSelectedIndices([]);
    setMemoryMoves(0);
    setMemoryMatches(0);
    setMemorySeconds(0);
    setLastResult(null);
    setPhase('PLAYING');
  };

  useEffect(() => {
    if (activeGame !== 'memory' || phase !== 'PLAYING') return;
    const timer = window.setInterval(() => {
      setMemorySeconds(s => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeGame, phase]);

  const flipCard = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (lockBoardRef.current) return;
    const clicked = cards[index];
    if (!clicked || clicked.flipped || clicked.matched) return;

    sfx.playPop();
    const updated = cards.map((c, idx) => (idx === index ? { ...c, flipped: true } : c));
    setCards(updated);

    const nextSelected = [...selectedIndices, index];
    setSelectedIndices(nextSelected);

    if (nextSelected.length === 2) {
      lockBoardRef.current = true;
      const nextMoves = memoryMoves + 1;
      setMemoryMoves(nextMoves);

      const [firstIdx, secondIdx] = nextSelected;
      const first = updated[firstIdx];
      const second = updated[secondIdx];

      if (first.pairId === second.pairId) {
        sfx.playCoin(memoryMatches + 2);
        spawnJuice(e.clientX, e.clientY, 'Cocok! +5 🪙', 'coin');
        const nextMatches = memoryMatches + 1;
        window.setTimeout(() => {
          setCards(prev =>
            prev.map((c, idx) => (idx === firstIdx || idx === secondIdx ? { ...c, matched: true } : c)),
          );
          setSelectedIndices([]);
          setMemoryMatches(nextMatches);
          lockBoardRef.current = false;

          if (nextMatches === MEMORY_POOL.length) {
            const efficiencyBonus = Math.max(0, (14 - nextMoves) * 3);
            const baseCoins = 26 + efficiencyBonus;
            const res = recordMiniGameResult('memory', Math.max(10, 100 - nextMoves * 4), baseCoins, nextMoves);
            setLastResult({
              score: nextMoves,
              coins: res.coinsEarned,
              bonus: res.bonusCoins,
              label: `Selesai dalam ${nextMoves} langkah (${memorySeconds} detik)`,
            });
            setPhase('SUMMARY');
          }
        }, 320);
      } else {
        window.setTimeout(() => {
          sfx.playBad();
          setCards(prev =>
            prev.map((c, idx) => (idx === firstIdx || idx === secondIdx ? { ...c, flipped: false } : c)),
          );
          setSelectedIndices([]);
          lockBoardRef.current = false;
        }, 680);
      }
    }
  };

  // Start Rhythm Bounce
  const startRhythm = () => {
    sfx.playPop();
    markerRef.current = 8;
    dirRef.current = 1;
    rhythmRoundRef.current = 1;
    rhythmMissesRef.current = 0;
    rhythmCoinsRef.current = 0;
    rhythmScoreRef.current = 0;
    rhythmStreakRef.current = 0;

    setMarkerPos(8);
    setZoneStart(38);
    setZoneWidth(24);
    setRhythmRound(1);
    setRhythmMisses(0);
    setRhythmCoins(0);
    setRhythmScore(0);
    setRhythmStreak(0);
    setRhythmFeedback('Tekan KETUK atau tombol Spasi tepat di zona hijau/emas!');
    setLastResult(null);
    setPhase('PLAYING');
  };

  useEffect(() => {
    if (activeGame !== 'rhythm' || phase !== 'PLAYING') return;
    let frameId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(40, now - lastTime);
      lastTime = now;

      const speed = 0.065 + rhythmRoundRef.current * 0.011;
      let next = markerRef.current + dirRef.current * speed * dt;
      if (next >= 96) {
        next = 96;
        dirRef.current = -1;
      } else if (next <= 4) {
        next = 4;
        dirRef.current = 1;
      }
      markerRef.current = next;
      setMarkerPos(next);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [activeGame, phase]);

  const handleRhythmStrike = useCallback(
    (clientX?: number, clientY?: number) => {
      if (activeGame !== 'rhythm' || phase !== 'PLAYING') return;
      const pos = markerRef.current;
      const center = zoneStart + zoneWidth / 2;
      const bullseyeHalf = zoneWidth * 0.22;
      const inGreen = pos >= zoneStart && pos <= zoneStart + zoneWidth;
      const inGold = Math.abs(pos - center) <= bullseyeHalf;

      const jx = clientX ?? window.innerWidth * 0.5;
      const jy = clientY ?? window.innerHeight * 0.45;

      if (inGold || inGreen) {
        const nextStreak = rhythmStreakRef.current + 1;
        rhythmStreakRef.current = nextStreak;
        setRhythmStreak(nextStreak);

        const gained = inGold ? 6 : 3;
        rhythmCoinsRef.current += gained;
        rhythmScoreRef.current += inGold ? 2 : 1;
        setRhythmCoins(rhythmCoinsRef.current);
        setRhythmScore(rhythmScoreRef.current);

        if (inGold) {
          sfx.playStarCoin();
          setRhythmFeedback(`SEMPURNA! Lemparan emas +${gained} Coin!`);
          spawnJuice(jx, jy, `BULLSEYE +${gained} 🪙`, 'coin');
        } else {
          sfx.playCoin(nextStreak);
          setRhythmFeedback(`Bagus! Tepat sasaran +${gained} Coin!`);
          spawnJuice(jx, jy, `+${gained} 🪙`, 'coin');
        }
      } else {
        sfx.playBad();
        rhythmStreakRef.current = 0;
        rhythmMissesRef.current += 1;
        setRhythmStreak(0);
        setRhythmMisses(rhythmMissesRef.current);
        setRhythmFeedback('Meleset! Coba lagi dengan tenang.');
        spawnJuice(jx, jy, 'Meleset!', 'bad');
      }

      const nextRound = rhythmRoundRef.current + 1;
      if (rhythmMissesRef.current >= 3 || nextRound > 10) {
        const finalCoins = Math.max(6, rhythmCoinsRef.current);
        const res = recordMiniGameResult('rhythm', rhythmScoreRef.current, finalCoins);
        setLastResult({
          score: rhythmScoreRef.current,
          coins: res.coinsEarned,
          bonus: res.bonusCoins,
          label: `${rhythmScoreRef.current} poin akurasi dalam ${Math.min(10, rhythmRoundRef.current)} ronde`,
        });
        setPhase('SUMMARY');
        return;
      }

      rhythmRoundRef.current = nextRound;
      setRhythmRound(nextRound);
      const nextWidth = Math.max(13, 24 - nextRound * 1.1);
      setZoneWidth(nextWidth);
      setZoneStart(18 + Math.random() * (64 - nextWidth));
    },
    [activeGame, phase, zoneStart, zoneWidth, spawnJuice, recordMiniGameResult],
  );

  // Spacebar shortcut for Rhythm Bounce
  useEffect(() => {
    if (activeGame !== 'rhythm' || phase !== 'PLAYING') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleRhythmStrike();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeGame, phase, handleRhythmStrike]);

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-24 md:pb-12">
      {/* Arcade Header & Game Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#171713]/65">Arcade · Kumpulkan Coin 🪙</p>
          <h1 className="flex items-center gap-2 font-display text-3xl sm:text-4xl font-extrabold">
            <Gamepad2 className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" aria-hidden="true" />
            Mini Game PetCoin
          </h1>
          <p className="text-sm text-[#171713]/80 mt-1">
            Bermain bersama <strong>{activePetDef.name}</strong> untuk panen Coin dan beli aksesori di Toko!
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'catch' as GameTab, label: 'Tangkap Koin', icon: Zap },
            { id: 'memory' as GameTab, label: 'Cocokkan Kartu', icon: Grid2X2 },
            { id: 'rhythm' as GameTab, label: 'Lempar Tangkap', icon: Flame },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeGame === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchGame(tab.id)}
                className={`neo-btn px-3.5 py-2 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 whitespace-nowrap ${
                  active ? 'bg-[#ffd86b]' : 'bg-[#fffaf0]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Game Arena Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section
          className={`lg:col-span-8 neo-card p-5 sm:p-6 bg-[#fffaf0] flex flex-col justify-between min-h-[450px] ${
            shakeArena ? 'animate-shake' : ''
          }`}
        >
          {/* GAME 1: COIN CATCH */}
          {activeGame === 'catch' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-[#171713]/15">
                <div className="flex items-center gap-4 text-xs sm:text-sm font-extrabold">
                  <span className="font-mono-num flex items-center gap-1">
                    <Timer className="w-4 h-4" /> {catchTime}s
                  </span>
                  <span className="font-mono-num">🪙 {catchCoins} Coin</span>
                  <span className="font-mono-num bg-[#ffd86b] border border-[#171713] px-2 py-0.5">
                    Combo x{catchCombo >= 8 ? 3 : catchCombo >= 4 ? 2 : 1}
                  </span>
                </div>
                <span className="font-mono-num text-xs font-bold text-[#171713]/70">
                  Rekor: {state.statsTotals.bestCoinCatch}
                </span>
              </div>

              {phase === 'MENU' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-4">
                  <img
                    src={pngUrl('coin.png')}
                    alt="Coin"
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-contain drop-shadow-[3px_3px_0_#171713]"
                  />
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold">Tangkap Koin</h2>
                  <p className="text-sm text-[#171713]/80 max-w-md">
                    Klik Koin (<strong>+2 🪙</strong>) dan Bintang Emas (<strong>+4 🪙</strong>) sebelum menghilang! Hindari lumpur agar Combo x2 &amp; x3 tetap menyala.
                  </p>
                  <button
                    type="button"
                    onClick={startCatch}
                    className="neo-btn bg-[#8be084] px-6 py-3 text-base font-extrabold"
                  >
                    Mulai Main (25 Detik)
                  </button>
                </div>
              )}

              {phase === 'PLAYING' && (
                <div className="relative flex-1 min-h-[320px] mt-4 border-2 border-[#171713] bg-[#b9ecf0] room-grid-bg overflow-hidden select-none">
                  {targets.map(target => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={e => hitTarget(target, e)}
                      style={{ left: `${target.x}%`, top: `${target.y}%` }}
                      className={`neo-btn absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                        target.kind === 'star'
                          ? 'bg-[#ffd86b]'
                          : target.kind === 'mud'
                            ? 'bg-[#80522f] text-white'
                            : 'bg-[#fffaf0]'
                      }`}
                    >
                      {target.kind === 'star' ? '⭐' : target.kind === 'mud' ? '💩' : '🪙'}
                    </button>
                  ))}
                  {targets.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs font-bold text-[#171713]/60">
                      Bersiap menangkap koin...
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* GAME 2: MEMORY MATCH */}
          {activeGame === 'memory' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-[#171713]/15">
                <div className="flex items-center gap-4 text-xs sm:text-sm font-extrabold">
                  <span className="font-mono-num">
                    Pasangan: {memoryMatches} / {MEMORY_POOL.length}
                  </span>
                  <span className="font-mono-num">Langkah: {memoryMoves}</span>
                  <span className="font-mono-num">{memorySeconds}s</span>
                </div>
                <span className="font-mono-num text-xs font-bold text-[#171713]/70">
                  Rekor Terbaik: {state.statsTotals.bestMemoryMoves ? `${state.statsTotals.bestMemoryMoves} langkah` : '-'}
                </span>
              </div>

              {phase === 'MENU' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-4">
                  <img
                    src={pngUrl(PET_CATALOG[0].sprites.happy)}
                    alt="Mochi"
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 object-contain"
                  />
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold">Cocokkan Kartu</h2>
                  <p className="text-sm text-[#171713]/80 max-w-md">
                    Buka 2 kartu sekaligus dan temukan semua 6 pasangan gambar pet. Makin sedikit langkahmu, makin besar bonus Coin-nya!
                  </p>
                  <button
                    type="button"
                    onClick={startMemory}
                    className="neo-btn bg-[#ffd86b] px-6 py-3 text-base font-extrabold"
                  >
                    Mulai Main Kartu
                  </button>
                </div>
              )}

              {phase === 'PLAYING' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-4 flex-1 content-center">
                  {cards.map((card, idx) => {
                    const revealed = card.flipped || card.matched;
                    return (
                      <button
                        key={card.uid}
                        type="button"
                        onClick={e => flipCard(idx, e)}
                        disabled={revealed}
                        className={`neo-btn h-24 sm:h-28 flex flex-col items-center justify-center p-2 transition-transform ${
                          card.matched
                            ? 'bg-[#8be084]'
                            : revealed
                              ? 'bg-[#fffaf0]'
                              : 'bg-[#d3b8ff]'
                        }`}
                      >
                        {revealed ? (
                          <>
                            <img
                              src={pngUrl(card.image)}
                              alt={card.label}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                            />
                            <span className="text-[11px] font-extrabold mt-1">{card.label}</span>
                          </>
                        ) : (
                          <span className="font-display text-2xl font-extrabold">?</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* GAME 3: RHYTHM BOUNCE */}
          {activeGame === 'rhythm' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-[#171713]/15">
                <div className="flex items-center gap-4 text-xs sm:text-sm font-extrabold">
                  <span className="font-mono-num">Ronde {rhythmRound} / 10</span>
                  <span className="font-mono-num">🪙 {rhythmCoins} Coin</span>
                  <span className="font-mono-num">Nyawa: {'♥'.repeat(3 - rhythmMisses)}</span>
                </div>
                <span className="font-mono-num text-xs font-bold text-[#171713]/70">
                  Rekor Poin: {state.statsTotals.bestRhythmScore}
                </span>
              </div>

              {phase === 'MENU' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-4">
                  <img
                    src={pngUrl('racket.png')}
                    alt="Raket"
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-contain"
                  />
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold">Lempar Tangkap</h2>
                  <p className="text-sm text-[#171713]/80 max-w-md">
                    Tekan tombol <strong>KETUK!</strong> atau <strong>Spasi</strong> saat penanda melintasi zona hijau (<strong>+3 🪙</strong>) atau tepat di tengah emas (<strong>+6 🪙</strong>)!
                  </p>
                  <button
                    type="button"
                    onClick={startRhythm}
                    className="neo-btn bg-[#ff8fb3] px-6 py-3 text-base font-extrabold"
                  >
                    Mulai Main Lempar Tangkap
                  </button>
                </div>
              )}

              {phase === 'PLAYING' && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-4">
                  <PetAvatar
                    petId={state.activePetId}
                    mood={rhythmStreak > 0 ? 'happy' : 'normal'}
                    equipped={activePet.equipped}
                    squishKey={rhythmScore}
                    className="w-36 h-36"
                  />

                  {/* Timing Track */}
                  <div className="w-full max-w-lg space-y-2">
                    <div className="relative h-12 border-3 border-[#171713] bg-[#f5efdf] overflow-hidden shadow-[3px_3px_0_#171713]">
                      {/* Green Target Zone */}
                      <div
                        style={{ left: `${zoneStart}%`, width: `${zoneWidth}%` }}
                        className="absolute inset-y-0 bg-[#8be084] border-x-2 border-[#171713]"
                      />
                      {/* Gold Bullseye */}
                      <div
                        style={{
                          left: `${zoneStart + zoneWidth * 0.28}%`,
                          width: `${zoneWidth * 0.44}%`,
                        }}
                        className="absolute inset-y-0 bg-[#ffd86b]"
                      />
                      {/* Moving Marker */}
                      <div
                        style={{ left: `${markerPos}%` }}
                        className="absolute top-0 bottom-0 w-2.5 -translate-x-1/2 bg-[#171713]"
                      />
                    </div>
                    <p className="text-center text-xs font-bold">{rhythmFeedback}</p>
                  </div>

                  <button
                    type="button"
                    onClick={e => handleRhythmStrike(e.clientX, e.clientY)}
                    className="neo-btn bg-[#ffd86b] px-10 py-4 text-lg font-extrabold"
                  >
                    KETUK! (Spasi)
                  </button>
                </div>
              )}
            </>
          )}

          {/* ROUND SUMMARY OVERLAY (SHARED ACROSS ALL 3 GAMES) */}
          {phase === 'SUMMARY' && lastResult && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-4">
              <div className="w-14 h-14 border-2 border-[#171713] bg-[#ffd86b] shadow-[3px_3px_0_#171713] flex items-center justify-center">
                <Trophy className="w-7 h-7" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold">Ronde Selesai!</h2>
              <p className="text-sm font-semibold text-[#171713]/80">{lastResult.label}</p>

              <div className="neo-card-sm bg-[#ffe28a] px-6 py-4 space-y-1">
                <div className="font-mono-num text-2xl font-extrabold">
                  +{lastResult.coins + lastResult.bonus} 🪙 Coin
                </div>
                {lastResult.bonus > 0 && (
                  <div className="text-xs font-bold">
                    Termasuk bonus +{lastResult.bonus} Coin dari keahlian {activePetDef.name}!
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (activeGame === 'catch') startCatch();
                  else if (activeGame === 'memory') startMemory();
                  else startRhythm();
                }}
                className="neo-btn bg-[#8be084] px-6 py-3 text-sm font-extrabold flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Main Lagi</span>
              </button>
            </div>
          )}
        </section>

        {/* Side Companion Info & Tips */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="neo-card p-5 bg-[#ffe28a] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold">Partner Arcade Aktif</span>
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 bg-[#fffaf0] border-2 border-[#171713] p-1 flex items-center justify-center shrink-0">
                <PetAvatar
                  petId={state.activePetId}
                  mood="happy"
                  equipped={activePet.equipped}
                  className="w-full h-full"
                />
              </div>
              <div>
                <h3 className="font-display text-lg font-extrabold">{activePetDef.name}</h3>
                <p className="text-xs text-[#171713]/85 mt-0.5">{activePetDef.perkLabel}</p>
              </div>
            </div>
          </div>

          <div className="neo-card p-5 bg-[#fffaf0] space-y-3">
            <div className="flex items-center gap-2 font-display text-base font-extrabold">
              <Sparkles className="w-4 h-4" />
              <span>Cara Menggunakan Coin 🪙</span>
            </div>
            <p className="text-xs text-[#171713]/80 leading-relaxed">
              Setiap kali menyelesaikan Mini Game, kamu mendapatkan <strong>Coin 🪙</strong>. Kunjungi menu <strong>Toko → Butik Aksesori</strong> untuk membeli gaya rambut (Long, Curly, Short), topi, syal, kalung, serta mainan seru untuk hewan kesayanganmu!
            </p>
            <div className="pt-2 border-t border-[#171713]/15 flex justify-between text-xs font-bold">
              <span>Total Ronde Dimainkan</span>
              <span className="font-mono-num">{state.statsTotals.totalMiniGames}x</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
