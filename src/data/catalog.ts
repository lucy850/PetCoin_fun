import { AchievementDef, FoodItem, PetCatalogItem, PetId, PlayToolItem } from '../types/game';

export const PNG_BASE = '/assets/png/';

export function pngUrl(filename: string): string {
  return PNG_BASE + encodeURIComponent(filename);
}

export const PET_CATALOG: PetCatalogItem[] = [
  {
    id: 'cat',
    name: 'Mochi',
    speciesLabel: 'Kucing · Starter Pal',
    rarity: 'Common',
    priceTreats: 0,
    tagline: 'Kucing santai yang lincah dan selalu siap bermain.',
    perkLabel: 'Bonus +1 Treat tiap 3x elus combo',
    cardBg: '#ffc7da',
    sprites: {
      normal: 'kucing123.png',
      happy: 'kucing senang.png',
      sad: 'kucing nangis.png',
    },
    hairAssets: [
      {
        id: 'long',
        name: 'Long Hair',
        priceCoins: 20,
        normal: 'panjang kucing.png',
        happy: 'panjang kucing seneng.png',
        sad: 'panjang kucing sedih.png',
      },
      {
        id: 'curly',
        name: 'Curly Hair',
        priceCoins: 35,
        normal: 'curly kucing.png',
        happy: 'curly kucing seneng.png',
        sad: 'curly kucing sedih.png',
      },
      {
        id: 'short',
        name: 'Short Hair',
        priceCoins: 35,
        normal: 'pendek kucing.png',
        happy: 'pendek kucing seneng.png',
        sad: 'pendek kucing sedih.png',
      },
    ],
    accessoryAssets: [
      { id: 'hat', name: 'Topi Lucu', priceCoins: 25, image: 'topi kucing.png' },
      { id: 'scarf', name: 'Syal Hangat', priceCoins: 40, image: 'syal kucing.png' },
      { id: 'necklace', name: 'Kalung Bintang', priceCoins: 60, image: 'kalung kucing.png' },
    ],
  },
  {
    id: 'elephant',
    name: 'Gajah',
    speciesLabel: 'Gajah · Gentle Giant',
    rarity: 'Common',
    priceTreats: 15,
    tagline: 'Manis, kalem, dan paling suka mandi air segar.',
    perkLabel: 'Bonus +25% XP saat mandi di Bathroom',
    cardBg: '#dfd1ff',
    sprites: {
      normal: 'gajah 1.png',
      happy: 'gajah seneng.png',
      sad: 'gajah sedih.png',
    },
    hairAssets: [
      {
        id: 'long',
        name: 'Long Hair',
        priceCoins: 20,
        normal: 'long gajah.png',
        happy: 'long gajah seneng.png',
        sad: 'long gajah sedih.png',
      },
      {
        id: 'curly',
        name: 'Curly Hair',
        priceCoins: 35,
        normal: 'curly gajah.png',
        happy: 'curly gajah seneng.png',
        sad: 'curly gajah sedih.png',
      },
      {
        id: 'short',
        name: 'Short Hair',
        priceCoins: 35,
        normal: 'short gajah.png',
        happy: 'short gajah seneng.png',
        sad: 'short gajah sedih.png',
      },
    ],
    accessoryAssets: [
      { id: 'hat', name: 'Topi Safari', priceCoins: 25, image: 'hat gajah.png' },
      { id: 'scarf', name: 'Syal Rajut', priceCoins: 40, image: 'syal gajah.png' },
      { id: 'necklace', name: 'Kalung Emas', priceCoins: 60, image: 'kalung gajah.png' },
    ],
  },
  {
    id: 'bear',
    name: 'Barnaby',
    speciesLabel: 'Beruang · Cozy Friend',
    rarity: 'Rare',
    priceTreats: 35,
    tagline: 'Beruang hangat yang doyan camilan manis dan tidur siang.',
    perkLabel: 'Bonus +1 Treat tiap kali makan di Kitchen',
    cardBg: '#ffe28a',
    sprites: {
      normal: 'Bear 1.png',
      happy: 'bear love.png',
      sad: 'bear sad.png',
    },
    hairAssets: [
      {
        id: 'long',
        name: 'Long Hair',
        priceCoins: 20,
        normal: 'long beruang.png',
        happy: 'long beruang seneng.png',
        sad: 'long beruang sedih.png',
      },
      {
        id: 'curly',
        name: 'Curly Hair',
        priceCoins: 35,
        normal: 'curly beruang.png',
        happy: 'curly beruang seneng.png',
        sad: 'curly beruang sedih.png',
      },
      {
        id: 'short',
        name: 'Short Hair',
        priceCoins: 35,
        normal: 'short beruang.png',
        happy: 'short beruang seneng.png',
        sad: 'short beruang sedih.png',
      },
    ],
    accessoryAssets: [
      { id: 'hat', name: 'Topi Rimba', priceCoins: 25, image: 'hat beruang.png' },
      { id: 'scarf', name: 'Syal Madu', priceCoins: 40, image: 'syal beruang.png' },
      { id: 'necklace', name: 'Kalung Liontin', priceCoins: 60, image: 'kalung beruang.png' },
    ],
  },
  {
    id: 'rabbit',
    name: 'Boba',
    speciesLabel: 'Kelinci · Bouncy Sprinter',
    rarity: 'Epic',
    priceTreats: 70,
    tagline: 'Kelinci lincah dengan energi melompat tiada henti.',
    perkLabel: 'Bonus +15% Coin saat bermain Mini Game',
    cardBg: '#ffb3a7',
    sprites: {
      normal: 'kelinci.png',
      happy: 'kelinci love.png',
      sad: 'kelinci sedih.png',
    },
    hairAssets: [
      {
        id: 'long',
        name: 'Long Hair',
        priceCoins: 20,
        normal: 'long kelinci.png',
        happy: 'long kelinci senang.png',
        sad: 'long kelinci nangis.png',
      },
      {
        id: 'curly',
        name: 'Curly Hair',
        priceCoins: 35,
        normal: 'curly kelinci.png',
        happy: 'curly kelinci senang.png',
        sad: 'curly kelinci nangis.png',
      },
      {
        id: 'short',
        name: 'Short Hair',
        priceCoins: 35,
        normal: 'short kelinci.png',
        happy: 'short kelinci senang.png',
        sad: 'short kelinci nangis.png',
      },
    ],
    accessoryAssets: [
      { id: 'hat', name: 'Topi Pesta', priceCoins: 25, image: 'hat kelinci.png' },
      { id: 'scarf', name: 'Syal Pastel', priceCoins: 40, image: 'syal kelinci.png' },
      { id: 'necklace', name: 'Kalung Mutiara', priceCoins: 60, image: 'kalung kelinci.png' },
    ],
  },
  {
    id: 'chicken',
    name: 'Chiki',
    speciesLabel: 'Ayam · Sunny Legend',
    rarity: 'Legendary',
    priceTreats: 120,
    tagline: 'Ayam ceria penuh kejutan yang membawa keberuntungan ganda.',
    perkLabel: 'Bonus +25% Coin & +1 Treat setiap level up',
    cardBg: '#a6e5f5',
    sprites: {
      normal: 'Ayam.png',
      happy: 'ayam love.png',
      sad: 'ayam sedih.png',
    },
    hairAssets: [
      {
        id: 'long',
        name: 'Long Hair',
        priceCoins: 20,
        normal: 'long ayam.png',
        happy: 'long ayam seneng.png',
        sad: 'long ayam sedih.png',
      },
      {
        id: 'curly',
        name: 'Curly Hair',
        priceCoins: 35,
        normal: 'curly ayam.png',
        happy: 'curly ayam seneng.png',
        sad: 'curly ayam sedih.png',
      },
      {
        id: 'short',
        name: 'Short Hair',
        priceCoins: 35,
        normal: 'short ayam.png',
        happy: 'short ayam seneng.png',
        sad: 'short ayam sedih.png',
      },
    ],
    accessoryAssets: [
      { id: 'hat', name: 'Topi Juara', priceCoins: 25, image: 'hat ayam.png' },
      { id: 'scarf', name: 'Syal Pagi', priceCoins: 40, image: 'syal ayam.png' },
      { id: 'necklace', name: 'Kalung Emas', priceCoins: 60, image: 'kalung ayam.png' },
    ],
  },
];

export const PET_BY_ID: Record<PetId, PetCatalogItem> = PET_CATALOG.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<PetId, PetCatalogItem>,
);

export const PLAY_TOOLS: PlayToolItem[] = [
  { id: 'racket', name: 'Raket Seru', priceCoins: 30, image: 'racket.png', actionLabel: 'Main Badminton' },
  { id: 'basket', name: 'Bola Basket', priceCoins: 45, image: 'basket.png', actionLabel: 'Lempar Bola' },
  { id: 'fishing', name: 'Pancingan', priceCoins: 65, image: 'pancingan.png', actionLabel: 'Main Pancing' },
];

export const FOODS: FoodItem[] = [
  { id: 'apple', name: 'Apel Segar', image: 'apel.png', hungerRestore: 14, happyBonus: 3, xpGain: 8, treatReward: 1 },
  { id: 'cookies', name: 'Cookies', image: 'cookies.png', hungerRestore: 18, happyBonus: 5, xpGain: 10, treatReward: 1 },
  { id: 'cupcake', name: 'Cupcake', image: 'cupcake.png', hungerRestore: 22, happyBonus: 8, xpGain: 12, treatReward: 2 },
  { id: 'burger', name: 'Burger', image: 'burger.png', hungerRestore: 28, happyBonus: 6, xpGain: 14, treatReward: 2 },
  { id: 'pizza', name: 'Pizza', image: 'pizza.png', hungerRestore: 30, happyBonus: 8, xpGain: 15, treatReward: 2 },
  { id: 'cake', name: 'Kue Tart', image: 'kue.png', hungerRestore: 35, happyBonus: 12, xpGain: 18, treatReward: 3 },
];

export const DAILY_STREAK_REWARDS = [
  { day: 1, treats: 5, coins: 20 },
  { day: 2, treats: 7, coins: 30 },
  { day: 3, treats: 10, coins: 40 },
  { day: 4, treats: 12, coins: 50 },
  { day: 5, treats: 15, coins: 65 },
  { day: 6, treats: 20, coins: 80 },
  { day: 7, treats: 35, coins: 150 },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_friend',
    title: 'Sahabat Baru',
    description: 'Adopsi hewan kedua untuk menemani Mochi.',
    rewardType: 'coins',
    rewardAmount: 40,
    target: 2,
  },
  {
    id: 'full_house',
    title: 'Kolektor Sejati',
    description: 'Adopsi seluruh 5 pet lucu di PetCoin.',
    rewardType: 'coins',
    rewardAmount: 150,
    target: 5,
  },
  {
    id: 'gentle_touch',
    title: 'Tangan Penyayang',
    description: 'Elus pet kesayanganmu sebanyak 25 kali.',
    rewardType: 'treats',
    rewardAmount: 10,
    target: 25,
  },
  {
    id: 'master_chef',
    title: 'Koki Dapur',
    description: 'Beri makan pet sebanyak 15 kali di Kitchen.',
    rewardType: 'treats',
    rewardAmount: 12,
    target: 15,
  },
  {
    id: 'spa_lover',
    title: 'Ahli Mandi Busa',
    description: 'Selesaikan mandi lengkap 5 kali di Bathroom.',
    rewardType: 'treats',
    rewardAmount: 15,
    target: 5,
  },
  {
    id: 'arcade_rookie',
    title: 'Pemain Arcade',
    description: 'Selesaikan 5 ronde Mini Game untuk kumpulkan Coin.',
    rewardType: 'treats',
    rewardAmount: 12,
    target: 5,
  },
  {
    id: 'fashionista',
    title: 'Penata Gaya',
    description: 'Miliki minimal 3 item gaya atau mainan.',
    rewardType: 'treats',
    rewardAmount: 15,
    target: 3,
  },
  {
    id: 'pet_level_5',
    title: 'Ikatan Kuat',
    description: 'Naikkan salah satu pet hingga Level 5.',
    rewardType: 'coins',
    rewardAmount: 100,
    target: 5,
  },
];

export function xpNeededForLevel(level: number): number {
  return 40 + (level - 1) * 25;
}
