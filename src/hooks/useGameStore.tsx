import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ACHIEVEMENTS,
  DAILY_STREAK_REWARDS,
  FOODS,
  PET_BY_ID,
  PET_CATALOG,
  PLAY_TOOLS,
  xpNeededForLevel,
} from '../data/catalog';
import {
  AccessoryCategory,
  DailyMissionState,
  GameSaveState,
  JuiceParticle,
  PetId,
  PetSaveData,
} from '../types/game';
import { sfx } from '../utils/sound';

const SAVE_KEY = 'petcoin_v2_save';

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function createDailyMissions(): DailyMissionState[] {
  return [
    {
      id: 'daily_care',
      title: 'Penyayang Aktif',
      description: 'Elus atau ajak main pet sebanyak 8 kali',
      target: 8,
      progress: 0,
      rewardType: 'treats',
      rewardAmount: 5,
      claimed: false,
    },
    {
      id: 'daily_feed_bath',
      title: 'Perawatan Lengkap',
      description: 'Beri makan 3x atau mandikan pet hingga bersih',
      target: 3,
      progress: 0,
      rewardType: 'treats',
      rewardAmount: 6,
      claimed: false,
    },
    {
      id: 'daily_minigame',
      title: 'Juara Arcade',
      description: 'Selesaikan 2 ronde Mini Game',
      target: 2,
      progress: 0,
      rewardType: 'coins',
      rewardAmount: 35,
      claimed: false,
    },
  ];
}

function defaultPetSave(now: number): PetSaveData {
  return {
    stats: { happy: 82, hungry: 76, clean: 85, energy: 88 },
    xp: 0,
    level: 1,
    equipped: {},
    inventory: { hair: [], accessories: [], playTools: [] },
    lastUpdated: now,
  };
}

function createInitialState(): GameSaveState {
  const now = Date.now();
  const today = todayKey();

  // Check if user already had legacy PetCoin data in localStorage
  let legacyTreats = 0;
  const legacyOwned: PetId[] = ['cat'];
  try {
    legacyTreats = Number(localStorage.getItem('petcoin-treats') || 0);
    const unlockedRaw = JSON.parse(localStorage.getItem('petcoin-unlocked') || '[]') as string[];
    if (Array.isArray(unlockedRaw)) {
      if (unlockedRaw.includes('Gajah')) legacyOwned.push('elephant');
      if (unlockedRaw.includes('Bear')) legacyOwned.push('bear');
      if (unlockedRaw.includes('Boba')) legacyOwned.push('rabbit');
      if (unlockedRaw.includes('Ayam')) legacyOwned.push('chicken');
    }
  } catch {
    // ignore invalid legacy JSON
  }

  return {
    treats: Math.max(6, legacyTreats),
    coins: 30,
    ownedPets: Array.from(new Set(legacyOwned)),
    activePetId: 'cat',
    pets: {
      cat: defaultPetSave(now),
      elephant: defaultPetSave(now),
      bear: defaultPetSave(now),
      rabbit: defaultPetSave(now),
      chicken: defaultPetSave(now),
    },
    muted: false,
    onboardingSteps: {
      petted: false,
      playedMiniGame: false,
      visitedShop: false,
    },
    statsTotals: {
      totalPetsGiven: 0,
      totalFeeds: 0,
      totalBaths: 0,
      totalNaps: 0,
      totalMiniGames: 0,
      bestCoinCatch: 0,
      bestRhythmScore: 0,
      bestMemoryMoves: 0,
    },
    daily: {
      lastDate: today,
      streakDay: 1,
      checkedInToday: false,
      missions: createDailyMissions(),
    },
    claimedAchievements: [],
  };
}

function applyOfflineDecay(pet: PetSaveData, now: number): PetSaveData {
  const elapsedMinutes = Math.max(0, (now - pet.lastUpdated) / 60000);
  if (elapsedMinutes < 0.5) return { ...pet, lastUpdated: now };
  const drop = Math.min(42, elapsedMinutes * 0.65);
  return {
    ...pet,
    stats: {
      happy: Math.max(20, Math.round(pet.stats.happy - drop * 0.8)),
      hungry: Math.max(18, Math.round(pet.stats.hungry - drop)),
      clean: Math.max(22, Math.round(pet.stats.clean - drop * 0.7)),
      energy: Math.max(25, Math.round(pet.stats.energy - drop * 0.6)),
    },
    lastUpdated: now,
  };
}

function loadSavedState(): GameSaveState {
  const now = Date.now();
  const today = todayKey();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as GameSaveState;
    const base = createInitialState();

    const pets: Record<PetId, PetSaveData> = { ...base.pets };
    for (const petDef of PET_CATALOG) {
      const existing = parsed.pets?.[petDef.id];
      pets[petDef.id] = existing ? applyOfflineDecay(existing, now) : defaultPetSave(now);
    }

    let daily = parsed.daily || base.daily;
    if (daily.lastDate !== today) {
      const prevDate = new Date(daily.lastDate + 'T00:00:00');
      const curDate = new Date(today + 'T00:00:00');
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / 86400000);
      const nextStreak = diffDays === 1 ? (daily.streakDay % 7) + 1 : 1;
      daily = {
        lastDate: today,
        streakDay: nextStreak,
        checkedInToday: false,
        missions: createDailyMissions(),
      };
    }

    return {
      ...base,
      ...parsed,
      pets,
      daily,
    };
  } catch {
    return createInitialState();
  }
}

export interface PetConditionInfo {
  label: string;
  note: string;
  mood: 'normal' | 'happy' | 'sad';
  tone: 'good' | 'warn' | 'alert';
}

export function getPetCondition(petId: PetId, stats: PetSaveData['stats'], happyMoment: boolean): PetConditionInfo {
  const petName = PET_BY_ID[petId].name;
  if (stats.hungry <= 25) {
    return {
      label: 'Lapar',
      note: `${petName} mulai lapar. Yuk beri camilan di Kitchen!`,
      mood: 'sad',
      tone: 'alert',
    };
  }
  if (stats.clean <= 28) {
    return {
      label: 'Kotor',
      note: `${petName} butuh mandi busa di Bathroom biar segar lagi!`,
      mood: 'sad',
      tone: 'alert',
    };
  }
  if (stats.energy <= 25) {
    return {
      label: 'Mengantuk',
      note: `${petName} kelelahan. Ajak bobo di Bedroom yuk!`,
      mood: 'sad',
      tone: 'warn',
    };
  }
  if (stats.happy <= 28) {
    return {
      label: 'Butuh Sayang',
      note: `${petName} kesepian. Elus atau ajak main sekarang!`,
      mood: 'sad',
      tone: 'warn',
    };
  }
  if (happyMoment || (stats.happy >= 85 && stats.hungry >= 70 && stats.clean >= 70 && stats.energy >= 60)) {
    return {
      label: 'Super Happy',
      note: `${petName} bersemangat sekali! Teruskan perawatanmu.`,
      mood: 'happy',
      tone: 'good',
    };
  }
  return {
    label: 'Feeling Good',
    note: `${petName} ceria dan siap berpetualang bersamamu.`,
    mood: happyMoment ? 'happy' : 'normal',
    tone: 'good',
  };
}

interface GameContextValue {
  state: GameSaveState;
  activePet: PetSaveData;
  activePetDef: (typeof PET_CATALOG)[number];
  petCombo: number;
  happyMoment: boolean;
  toastMessage: string | null;
  particles: JuiceParticle[];
  claimableCount: number;
  setActivePet: (petId: PetId) => void;
  toggleMute: () => void;
  showToast: (msg: string) => void;
  spawnJuice: (x: number, y: number, text: string, tone: JuiceParticle['tone']) => void;
  petThePet: (petId: PetId, clientX?: number, clientY?: number) => void;
  feedPet: (petId: PetId, foodId: string, clientX?: number, clientY?: number) => boolean;
  playWithPet: (petId: PetId, clientX?: number, clientY?: number) => boolean;
  cleanPetStep: (petId: PetId, step: 'soap' | 'rinse' | 'dry', clientX?: number, clientY?: number) => void;
  napPet: (petId: PetId, amount: number, completeBonus?: boolean, clientX?: number, clientY?: number) => void;
  adoptPet: (petId: PetId) => { ok: boolean; message: string };
  buyAccessory: (petId: PetId, category: AccessoryCategory, itemId: string) => { ok: boolean; message: string };
  equipAccessory: (petId: PetId, category: AccessoryCategory, itemId?: string) => void;
  recordMiniGameResult: (
    game: 'catch' | 'memory' | 'rhythm',
    score: number,
    baseCoins: number,
    memoryMoves?: number,
  ) => { coinsEarned: number; bonusCoins: number };
  claimDailyCheckIn: () => void;
  claimMission: (missionId: string) => void;
  getAchievementProgress: (id: string) => number;
  claimAchievement: (id: string) => void;
  markShopVisited: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameSaveState>(() => loadSavedState());
  const [petCombo, setPetCombo] = useState(0);
  const [happyMoment, setHappyMoment] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [particles, setParticles] = useState<JuiceParticle[]>([]);

  const happyTimeoutRef = useRef<number | null>(null);
  const comboTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const particleIdRef = useRef(1);

  useEffect(() => {
    sfx.muted = state.muted;
  }, [state.muted]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  // Passive real-time gentle decay every 10 seconds
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setState(prev => {
        const nextPets = { ...prev.pets };
        for (const id of prev.ownedPets) {
          const p = nextPets[id];
          nextPets[id] = {
            ...p,
            stats: {
              happy: Math.max(10, p.stats.happy - 0.35),
              hungry: Math.max(10, p.stats.hungry - 0.45),
              clean: Math.max(10, p.stats.clean - 0.25),
              energy: Math.max(10, p.stats.energy - 0.25),
            },
            lastUpdated: now,
          };
        }
        return { ...prev, pets: nextPets };
      });
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const spawnJuice = useCallback((x: number, y: number, text: string, tone: JuiceParticle['tone']) => {
    const id = particleIdRef.current++;
    setParticles(prev => [...prev.slice(-18), { id, x, y, text, tone }]);
    window.setTimeout(() => {
      setParticles(prev => prev.filter(item => item.id !== id));
    }, 980);
  }, []);

  const triggerHappyMoment = useCallback(() => {
    setHappyMoment(true);
    if (happyTimeoutRef.current) window.clearTimeout(happyTimeoutRef.current);
    happyTimeoutRef.current = window.setTimeout(() => setHappyMoment(false), 1600);
  }, []);

  const addXpAndApply = useCallback(
    (petId: PetId, petData: PetSaveData, xpGain: number): { updated: PetSaveData; leveledUp: boolean; levelTreatBonus: number } => {
      let xp = petData.xp + xpGain;
      let level = petData.level;
      let leveledUp = false;
      let levelTreatBonus = 0;

      while (xp >= xpNeededForLevel(level)) {
        xp -= xpNeededForLevel(level);
        level += 1;
        leveledUp = true;
        levelTreatBonus += petId === 'chicken' ? 4 : 3;
      }

      return {
        updated: { ...petData, xp, level, lastUpdated: Date.now() },
        leveledUp,
        levelTreatBonus,
      };
    },
    [],
  );

  const setActivePet = useCallback((petId: PetId) => {
    sfx.playPop();
    setState(prev => ({
      ...prev,
      activePetId: prev.ownedPets.includes(petId) ? petId : prev.activePetId,
    }));
  }, []);

  const toggleMute = useCallback(() => {
    setState(prev => {
      const nextMuted = !prev.muted;
      sfx.muted = nextMuted;
      if (!nextMuted) sfx.playPop();
      return { ...prev, muted: nextMuted };
    });
  }, []);

  const petThePet = useCallback(
    (petId: PetId, clientX?: number, clientY?: number) => {
      const nextCombo = petCombo + 1;
      setPetCombo(nextCombo);
      if (comboTimeoutRef.current) window.clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = window.setTimeout(() => setPetCombo(0), 2200);

      triggerHappyMoment();
      sfx.playPetHappy(nextCombo);

      const cx = clientX ?? window.innerWidth * 0.45;
      const cy = clientY ?? window.innerHeight * 0.42;

      const awardsTreat = nextCombo % 3 === 0;
      const catBonus = petId === 'cat' && awardsTreat ? 1 : 0;
      const treatDelta = awardsTreat ? 1 + catBonus : 0;

      spawnJuice(cx, cy - 10, '♥ +Senang', 'love');
      if (treatDelta > 0) {
        window.setTimeout(() => {
          spawnJuice(cx + 28, cy - 28, `+${treatDelta} Treat 🍪`, 'treat');
        }, 120);
      }

      setState(prev => {
        const curPet = prev.pets[petId];
        const withHappy: PetSaveData = {
          ...curPet,
          stats: {
            ...curPet.stats,
            happy: Math.min(100, curPet.stats.happy + 7),
          },
        };
        const { updated, leveledUp, levelTreatBonus } = addXpAndApply(petId, withHappy, 5);
        if (leveledUp) {
          sfx.playLevelUp();
          showToast(`${PET_BY_ID[petId].name} naik ke Level ${updated.level}! +${levelTreatBonus} Treat`);
        }

        const nextMissions = prev.daily.missions.map(m =>
          m.id === 'daily_care' ? { ...m, progress: Math.min(m.target, m.progress + 1) } : m,
        );

        return {
          ...prev,
          treats: prev.treats + treatDelta + levelTreatBonus,
          onboardingSteps: { ...prev.onboardingSteps, petted: true },
          statsTotals: { ...prev.statsTotals, totalPetsGiven: prev.statsTotals.totalPetsGiven + 1 },
          pets: { ...prev.pets, [petId]: updated },
          daily: { ...prev.daily, missions: nextMissions },
        };
      });
    },
    [petCombo, triggerHappyMoment, spawnJuice, addXpAndApply, showToast],
  );

  const feedPet = useCallback(
    (petId: PetId, foodId: string, clientX?: number, clientY?: number) => {
      const food = FOODS.find(f => f.id === foodId);
      if (!food) return false;

      const currentPet = state.pets[petId];
      if (currentPet.stats.hungry >= 99) {
        sfx.playPop();
        showToast(`${PET_BY_ID[petId].name} sudah kenyang! Ajak main atau mandi dulu.`);
        return false;
      }

      sfx.playEat();
      triggerHappyMoment();

      const bearBonus = petId === 'bear' ? 1 : 0;
      const levelBonus = currentPet.level >= 3 ? 1 : 0;
      const treatDelta = food.treatReward + bearBonus + levelBonus;

      const cx = clientX ?? window.innerWidth * 0.48;
      const cy = clientY ?? window.innerHeight * 0.44;
      spawnJuice(cx - 18, cy - 12, `+${food.hungerRestore}% Kenyang`, 'xp');
      window.setTimeout(() => {
        spawnJuice(cx + 22, cy - 30, `+${treatDelta} Treat 🍪`, 'treat');
      }, 140);

      setState(prev => {
        const cur = prev.pets[petId];
        const nextStats = {
          ...cur.stats,
          hungry: Math.min(100, cur.stats.hungry + food.hungerRestore),
          happy: Math.min(100, cur.stats.happy + food.happyBonus),
        };
        const { updated, leveledUp, levelTreatBonus } = addXpAndApply(petId, { ...cur, stats: nextStats }, food.xpGain);
        if (leveledUp) {
          sfx.playLevelUp();
          showToast(`${PET_BY_ID[petId].name} naik ke Level ${updated.level}! +${levelTreatBonus} Treat`);
        }

        const nextMissions = prev.daily.missions.map(m =>
          m.id === 'daily_feed_bath' ? { ...m, progress: Math.min(m.target, m.progress + 1) } : m,
        );

        return {
          ...prev,
          treats: prev.treats + treatDelta + levelTreatBonus,
          onboardingSteps: { ...prev.onboardingSteps, petted: true },
          statsTotals: { ...prev.statsTotals, totalFeeds: prev.statsTotals.totalFeeds + 1 },
          pets: { ...prev.pets, [petId]: updated },
          daily: { ...prev.daily, missions: nextMissions },
        };
      });

      return true;
    },
    [state.pets, showToast, triggerHappyMoment, spawnJuice, addXpAndApply],
  );

  const playWithPet = useCallback(
    (petId: PetId, clientX?: number, clientY?: number) => {
      const currentPet = state.pets[petId];
      if (currentPet.stats.energy <= 12) {
        sfx.playBad();
        showToast(`${PET_BY_ID[petId].name} terlalu lelah! Tidurkan sebentar di Bedroom.`);
        return false;
      }

      sfx.playPetHappy(4);
      triggerHappyMoment();
      const hasTool = Boolean(currentPet.equipped.playTools);
      const treatGain = hasTool ? 2 : 1;
      const happyGain = hasTool ? 16 : 10;

      const cx = clientX ?? window.innerWidth * 0.45;
      const cy = clientY ?? window.innerHeight * 0.44;
      spawnJuice(cx - 12, cy - 10, `+${happyGain}% Senang`, 'love');
      window.setTimeout(() => {
        spawnJuice(cx + 22, cy - 30, `+${treatGain} Treat 🍪`, 'treat');
      }, 120);

      setState(prev => {
        const cur = prev.pets[petId];
        const nextStats = {
          ...cur.stats,
          happy: Math.min(100, cur.stats.happy + happyGain),
          energy: Math.max(0, cur.stats.energy - 6),
          clean: Math.max(0, cur.stats.clean - 4),
        };
        const { updated, leveledUp, levelTreatBonus } = addXpAndApply(petId, { ...cur, stats: nextStats }, hasTool ? 14 : 9);
        if (leveledUp) {
          sfx.playLevelUp();
          showToast(`${PET_BY_ID[petId].name} naik ke Level ${updated.level}! +${levelTreatBonus} Treat`);
        }

        const nextMissions = prev.daily.missions.map(m =>
          m.id === 'daily_care' ? { ...m, progress: Math.min(m.target, m.progress + 1) } : m,
        );

        return {
          ...prev,
          treats: prev.treats + treatGain + levelTreatBonus,
          pets: { ...prev.pets, [petId]: updated },
          daily: { ...prev.daily, missions: nextMissions },
        };
      });
      return true;
    },
    [state.pets, showToast, triggerHappyMoment, spawnJuice, addXpAndApply],
  );

  const cleanPetStep = useCallback(
    (petId: PetId, step: 'soap' | 'rinse' | 'dry', clientX?: number, clientY?: number) => {
      const cx = clientX ?? window.innerWidth * 0.45;
      const cy = clientY ?? window.innerHeight * 0.42;

      if (step === 'soap') {
        sfx.playSoap();
        spawnJuice(cx, cy - 14, 'Busa Sabun! 🫧', 'clean');
        setState(prev => {
          const cur = prev.pets[petId];
          return {
            ...prev,
            pets: {
              ...prev.pets,
              [petId]: {
                ...cur,
                stats: { ...cur.stats, clean: Math.min(100, cur.stats.clean + 12) },
                lastUpdated: Date.now(),
              },
            },
          };
        });
        return;
      }

      if (step === 'rinse') {
        sfx.playSplash();
        spawnJuice(cx, cy - 14, '+20% Bersih 💧', 'clean');
        setState(prev => {
          const cur = prev.pets[petId];
          return {
            ...prev,
            pets: {
              ...prev.pets,
              [petId]: {
                ...cur,
                stats: { ...cur.stats, clean: Math.min(100, cur.stats.clean + 20) },
                lastUpdated: Date.now(),
              },
            },
          };
        });
        return;
      }

      // dry completes bath spa!
      sfx.playTowel();
      triggerHappyMoment();
      const xpGain = petId === 'elephant' ? 22 : 16;
      const treatReward = 3;

      spawnJuice(cx - 12, cy - 12, 'Bersih Kinclong! ✨', 'clean');
      window.setTimeout(() => {
        spawnJuice(cx + 22, cy - 32, `+${treatReward} Treat 🍪`, 'treat');
      }, 130);

      setState(prev => {
        const cur = prev.pets[petId];
        const nextStats = {
          ...cur.stats,
          clean: Math.min(100, cur.stats.clean + 35),
          happy: Math.min(100, cur.stats.happy + 12),
        };
        const { updated, leveledUp, levelTreatBonus } = addXpAndApply(petId, { ...cur, stats: nextStats }, xpGain);
        if (leveledUp) {
          sfx.playLevelUp();
          showToast(`${PET_BY_ID[petId].name} naik ke Level ${updated.level}! +${levelTreatBonus} Treat`);
        }

        const nextMissions = prev.daily.missions.map(m =>
          m.id === 'daily_feed_bath' ? { ...m, progress: Math.min(m.target, m.progress + 1) } : m,
        );

        return {
          ...prev,
          treats: prev.treats + treatReward + levelTreatBonus,
          statsTotals: { ...prev.statsTotals, totalBaths: prev.statsTotals.totalBaths + 1 },
          pets: { ...prev.pets, [petId]: updated },
          daily: { ...prev.daily, missions: nextMissions },
        };
      });
    },
    [spawnJuice, triggerHappyMoment, addXpAndApply, showToast],
  );

  const napPet = useCallback(
    (petId: PetId, amount: number, completeBonus = false, clientX?: number, clientY?: number) => {
      const cx = clientX ?? window.innerWidth * 0.45;
      const cy = clientY ?? window.innerHeight * 0.42;

      if (completeBonus) {
        sfx.playWake();
        triggerHappyMoment();
        spawnJuice(cx, cy - 16, '+2 Treat 🍪 · Segar!', 'treat');
      }

      setState(prev => {
        const cur = prev.pets[petId];
        const nextStats = {
          ...cur.stats,
          energy: Math.min(100, cur.stats.energy + amount),
          happy: completeBonus ? Math.min(100, cur.stats.happy + 8) : cur.stats.happy,
        };
        const xpGain = completeBonus ? 12 : 0;
        const { updated, leveledUp, levelTreatBonus } = addXpAndApply(petId, { ...cur, stats: nextStats }, xpGain);
        if (leveledUp) {
          sfx.playLevelUp();
          showToast(`${PET_BY_ID[petId].name} naik ke Level ${updated.level}! +${levelTreatBonus} Treat`);
        }

        return {
          ...prev,
          treats: prev.treats + (completeBonus ? 2 : 0) + levelTreatBonus,
          statsTotals: {
            ...prev.statsTotals,
            totalNaps: prev.statsTotals.totalNaps + (completeBonus ? 1 : 0),
          },
          pets: { ...prev.pets, [petId]: updated },
        };
      });
    },
    [triggerHappyMoment, spawnJuice, addXpAndApply, showToast],
  );

  const adoptPet = useCallback(
    (petId: PetId) => {
      const def = PET_BY_ID[petId];
      if (!def) return { ok: false, message: 'Pet tidak ditemukan.' };
      if (state.ownedPets.includes(petId)) {
        return { ok: false, message: `${def.name} sudah ada di koleksimu!` };
      }
      if (state.treats < def.priceTreats) {
        sfx.playBad();
        return {
          ok: false,
          message: `Treat belum cukup! Butuh ${def.priceTreats} Treat (kurang ${def.priceTreats - state.treats}). Rawat pet untuk kumpulkan Treat!`,
        };
      }

      sfx.playUnlock();
      setState(prev => ({
        ...prev,
        treats: prev.treats - def.priceTreats,
        ownedPets: [...prev.ownedPets, petId],
        activePetId: petId,
        pets: {
          ...prev.pets,
          [petId]: {
            ...prev.pets[petId],
            stats: { happy: 95, hungry: 90, clean: 95, energy: 95 },
            lastUpdated: Date.now(),
          },
        },
      }));
      showToast(`Selamat! ${def.name} bergabung ke koleksimu!`);
      return { ok: true, message: `Selamat! ${def.name} berhasil diadopsi!` };
    },
    [state.ownedPets, state.treats, showToast],
  );

  const buyAccessory = useCallback(
    (petId: PetId, category: AccessoryCategory, itemId: string) => {
      const petDef = PET_BY_ID[petId];
      let priceCoins = 0;
      let itemName = '';

      if (category === 'hair') {
        const found = petDef.hairAssets.find(h => h.id === itemId);
        if (!found) return { ok: false, message: 'Item tidak ditemukan.' };
        priceCoins = found.priceCoins;
        itemName = found.name;
      } else if (category === 'accessories') {
        const found = petDef.accessoryAssets.find(a => a.id === itemId);
        if (!found) return { ok: false, message: 'Item tidak ditemukan.' };
        priceCoins = found.priceCoins;
        itemName = found.name;
      } else {
        const found = PLAY_TOOLS.find(t => t.id === itemId);
        if (!found) return { ok: false, message: 'Item tidak ditemukan.' };
        priceCoins = found.priceCoins;
        itemName = found.name;
      }

      const petData = state.pets[petId];
      if (petData.inventory[category].includes(itemId)) {
        return { ok: false, message: `${itemName} sudah dimiliki.` };
      }
      if (state.coins < priceCoins) {
        sfx.playBad();
        return {
          ok: false,
          message: `Coin belum cukup! Butuh ${priceCoins} Coin. Mainkan Mini Game untuk dapat Coin!`,
        };
      }

      sfx.playUnlock();
      setState(prev => {
        const cur = prev.pets[petId];
        return {
          ...prev,
          coins: prev.coins - priceCoins,
          pets: {
            ...prev.pets,
            [petId]: {
              ...cur,
              inventory: {
                ...cur.inventory,
                [category]: [...cur.inventory[category], itemId],
              },
              equipped: {
                ...cur.equipped,
                [category]: itemId,
              },
            },
          },
        };
      });
      showToast(`${itemName} dibeli & langsung dipakai ${petDef.name}!`);
      return { ok: true, message: `${itemName} berhasil dibeli & dipakai!` };
    },
    [state.coins, state.pets, showToast],
  );

  const equipAccessory = useCallback((petId: PetId, category: AccessoryCategory, itemId?: string) => {
    sfx.playPop();
    setState(prev => {
      const cur = prev.pets[petId];
      const nextEquipped = { ...cur.equipped };
      if (!itemId) {
        delete nextEquipped[category];
      } else {
        nextEquipped[category] = itemId;
      }
      return {
        ...prev,
        pets: {
          ...prev.pets,
          [petId]: {
            ...cur,
            equipped: nextEquipped,
          },
        },
      };
    });
  }, []);

  const recordMiniGameResult = useCallback(
    (game: 'catch' | 'memory' | 'rhythm', score: number, baseCoins: number, memoryMoves?: number) => {
      const activeId = state.activePetId;
      const multiplier = activeId === 'chicken' ? 0.25 : activeId === 'rabbit' ? 0.15 : 0;
      const bonusCoins = Math.round(baseCoins * multiplier);
      const totalCoins = baseCoins + bonusCoins;

      sfx.playWin();

      setState(prev => {
        const curPet = prev.pets[activeId];
        const nextStats = {
          ...curPet.stats,
          energy: Math.max(10, curPet.stats.energy - 8),
          happy: Math.min(100, curPet.stats.happy + 6),
        };
        const { updated, leveledUp, levelTreatBonus } = addXpAndApply(activeId, { ...curPet, stats: nextStats }, 12);
        if (leveledUp) {
          showToast(`${PET_BY_ID[activeId].name} naik ke Level ${updated.level}! +${levelTreatBonus} Treat`);
        }

        const nextMissions = prev.daily.missions.map(m =>
          m.id === 'daily_minigame' ? { ...m, progress: Math.min(m.target, m.progress + 1) } : m,
        );

        return {
          ...prev,
          coins: prev.coins + totalCoins,
          treats: prev.treats + levelTreatBonus,
          onboardingSteps: { ...prev.onboardingSteps, playedMiniGame: true },
          statsTotals: {
            ...prev.statsTotals,
            totalMiniGames: prev.statsTotals.totalMiniGames + 1,
            bestCoinCatch: game === 'catch' ? Math.max(prev.statsTotals.bestCoinCatch, score) : prev.statsTotals.bestCoinCatch,
            bestRhythmScore:
              game === 'rhythm' ? Math.max(prev.statsTotals.bestRhythmScore, score) : prev.statsTotals.bestRhythmScore,
            bestMemoryMoves:
              game === 'memory' && memoryMoves
                ? prev.statsTotals.bestMemoryMoves === 0
                  ? memoryMoves
                  : Math.min(prev.statsTotals.bestMemoryMoves, memoryMoves)
                : prev.statsTotals.bestMemoryMoves,
          },
          pets: { ...prev.pets, [activeId]: updated },
          daily: { ...prev.daily, missions: nextMissions },
        };
      });

      return { coinsEarned: baseCoins, bonusCoins };
    },
    [state.activePetId, addXpAndApply, showToast],
  );

  const claimDailyCheckIn = useCallback(() => {
    if (state.daily.checkedInToday) return;
    const reward = DAILY_STREAK_REWARDS[state.daily.streakDay - 1] || DAILY_STREAK_REWARDS[0];
    sfx.playWin();
    setState(prev => ({
      ...prev,
      treats: prev.treats + reward.treats,
      coins: prev.coins + reward.coins,
      daily: { ...prev.daily, checkedInToday: true },
    }));
    showToast(`Bonus Hari Ke-${state.daily.streakDay}: +${reward.treats} Treat & +${reward.coins} Coin!`);
  }, [state.daily.checkedInToday, state.daily.streakDay, showToast]);

  const claimMission = useCallback(
    (missionId: string) => {
      const mission = state.daily.missions.find(m => m.id === missionId);
      if (!mission || mission.claimed || mission.progress < mission.target) return;

      sfx.playWin();
      setState(prev => ({
        ...prev,
        treats: mission.rewardType === 'treats' ? prev.treats + mission.rewardAmount : prev.treats,
        coins: mission.rewardType === 'coins' ? prev.coins + mission.rewardAmount : prev.coins,
        daily: {
          ...prev.daily,
          missions: prev.daily.missions.map(m => (m.id === missionId ? { ...m, claimed: true } : m)),
        },
      }));
      showToast(
        `Misi "${mission.title}" selesai! +${mission.rewardAmount} ${mission.rewardType === 'treats' ? 'Treat' : 'Coin'}`,
      );
    },
    [state.daily.missions, showToast],
  );

  const getAchievementProgress = useCallback(
    (id: string): number => {
      switch (id) {
        case 'first_friend':
        case 'full_house':
          return state.ownedPets.length;
        case 'gentle_touch':
          return state.statsTotals.totalPetsGiven;
        case 'master_chef':
          return state.statsTotals.totalFeeds;
        case 'spa_lover':
          return state.statsTotals.totalBaths;
        case 'arcade_rookie':
          return state.statsTotals.totalMiniGames;
        case 'fashionista': {
          let totalItems = 0;
          for (const petId of state.ownedPets) {
            const inv = state.pets[petId].inventory;
            totalItems += inv.hair.length + inv.accessories.length + inv.playTools.length;
          }
          return totalItems;
        }
        case 'pet_level_5':
          return Math.max(...state.ownedPets.map(pid => state.pets[pid].level));
        default:
          return 0;
      }
    },
    [state.ownedPets, state.pets, state.statsTotals],
  );

  const claimAchievement = useCallback(
    (id: string) => {
      const def = ACHIEVEMENTS.find(a => a.id === id);
      if (!def || state.claimedAchievements.includes(id)) return;
      if (getAchievementProgress(id) < def.target) return;

      sfx.playUnlock();
      setState(prev => ({
        ...prev,
        treats: def.rewardType === 'treats' ? prev.treats + def.rewardAmount : prev.treats,
        coins: def.rewardType === 'coins' ? prev.coins + def.rewardAmount : prev.coins,
        claimedAchievements: [...prev.claimedAchievements, id],
      }));
      showToast(
        `Lencana "${def.title}" diklaim! +${def.rewardAmount} ${def.rewardType === 'treats' ? 'Treat' : 'Coin'}`,
      );
    },
    [state.claimedAchievements, getAchievementProgress, showToast],
  );

  const markShopVisited = useCallback(() => {
    setState(prev =>
      prev.onboardingSteps.visitedShop
        ? prev
        : { ...prev, onboardingSteps: { ...prev.onboardingSteps, visitedShop: true } },
    );
  }, []);

  const claimableCount = useMemo(() => {
    let count = state.daily.checkedInToday ? 0 : 1;
    count += state.daily.missions.filter(m => !m.claimed && m.progress >= m.target).length;
    count += ACHIEVEMENTS.filter(
      a => !state.claimedAchievements.includes(a.id) && getAchievementProgress(a.id) >= a.target,
    ).length;
    return count;
  }, [state.daily, state.claimedAchievements, getAchievementProgress]);

  const activePet = state.pets[state.activePetId] || state.pets.cat;
  const activePetDef = PET_BY_ID[state.activePetId] || PET_BY_ID.cat;

  return (
    <GameContext.Provider
      value={{
        state,
        activePet,
        activePetDef,
        petCombo,
        happyMoment,
        toastMessage,
        particles,
        claimableCount,
        setActivePet,
        toggleMute,
        showToast,
        spawnJuice,
        petThePet,
        feedPet,
        playWithPet,
        cleanPetStep,
        napPet,
        adoptPet,
        buyAccessory,
        equipAccessory,
        recordMiniGameResult,
        claimDailyCheckIn,
        claimMission,
        getAchievementProgress,
        claimAchievement,
        markShopVisited,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameStore() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameStore must be used inside GameProvider');
  return ctx;
}
