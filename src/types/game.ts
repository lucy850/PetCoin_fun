export type PetId = 'cat' | 'elephant' | 'bear' | 'rabbit' | 'chicken';

export type RoomId = 'kitchen' | 'closet' | 'bathroom' | 'bedroom';

export type AccessoryCategory = 'hair' | 'accessories' | 'playTools';

export type Rarity = 'Common' | 'Rare' | 'Special' | 'Epic' | 'Legendary';

export interface PetStats {
  happy: number;
  hungry: number;
  clean: number;
  energy: number;
}

export interface PetEquipped {
  hair?: string;
  accessories?: string;
  playTools?: string;
}

export interface PetInventory {
  hair: string[];
  accessories: string[];
  playTools: string[];
}

export interface PetSaveData {
  stats: PetStats;
  xp: number;
  level: number;
  equipped: PetEquipped;
  inventory: PetInventory;
  lastUpdated: number;
}

export interface PetCatalogItem {
  id: PetId;
  name: string;
  speciesLabel: string;
  rarity: Rarity;
  priceTreats: number;
  tagline: string;
  perkLabel: string;
  cardBg: string;
  sprites: {
    normal: string;
    happy: string;
    sad: string;
  };
  hairAssets: {
    id: string;
    name: string;
    priceCoins: number;
    normal: string;
    happy: string;
    sad: string;
  }[];
  accessoryAssets: {
    id: string;
    name: string;
    priceCoins: number;
    image: string;
  }[];
}

export interface PlayToolItem {
  id: string;
  name: string;
  priceCoins: number;
  image: string;
  actionLabel: string;
}

export interface FoodItem {
  id: string;
  name: string;
  image: string;
  hungerRestore: number;
  happyBonus: number;
  xpGain: number;
  treatReward: number;
}

export interface DailyMissionState {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardType: 'treats' | 'coins';
  rewardAmount: number;
  claimed: boolean;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  rewardType: 'treats' | 'coins';
  rewardAmount: number;
  target: number;
}

export interface JuiceParticle {
  id: number;
  x: number;
  y: number;
  text: string;
  tone: 'treat' | 'coin' | 'love' | 'xp' | 'clean' | 'bad';
}

export type ActiveView = 'home' | 'care' | 'minigames' | 'shop';

export interface GameSaveState {
  treats: number;
  coins: number;
  ownedPets: PetId[];
  activePetId: PetId;
  pets: Record<PetId, PetSaveData>;
  muted: boolean;
  onboardingSteps: {
    petted: boolean;
    playedMiniGame: boolean;
    visitedShop: boolean;
  };
  statsTotals: {
    totalPetsGiven: number;
    totalFeeds: number;
    totalBaths: number;
    totalNaps: number;
    totalMiniGames: number;
    bestCoinCatch: number;
    bestRhythmScore: number;
    bestMemoryMoves: number;
  };
  daily: {
    lastDate: string;
    streakDay: number;
    checkedInToday: boolean;
    missions: DailyMissionState[];
  };
  claimedAchievements: string[];
}
