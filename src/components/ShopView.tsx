import { useEffect, useState } from 'react';
import { Check, Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { PET_BY_ID, PET_CATALOG, PLAY_TOOLS, pngUrl } from '../data/catalog';
import { useGameStore } from '../hooks/useGameStore';
import { AccessoryCategory, ActiveView, PetId } from '../types/game';
import { sfx } from '../utils/sound';
import { PetAvatar } from './PetAvatar';

interface ShopViewProps {
  onNavigate: (view: ActiveView) => void;
}

type ShopTab = 'adopt' | 'accessories';

export function ShopView({ onNavigate }: ShopViewProps) {
  const {
    state,
    adoptPet,
    buyAccessory,
    equipAccessory,
    setActivePet,
    markShopVisited,
    showToast,
  } = useGameStore();

  const [tab, setTab] = useState<ShopTab>('adopt');
  const [selectedPetId, setSelectedPetId] = useState<PetId>(state.activePetId);
  const [catTab, setCatTab] = useState<AccessoryCategory>('hair');

  useEffect(() => {
    markShopVisited();
  }, [markShopVisited]);

  const targetPetDef = PET_BY_ID[selectedPetId];
  const targetPetSave = state.pets[selectedPetId];
  const isTargetOwned = state.ownedPets.includes(selectedPetId);

  const handleAdopt = (petId: PetId) => {
    const res = adoptPet(petId);
    if (!res.ok) showToast(res.message);
  };

  const handleBuyOrEquip = (category: AccessoryCategory, itemId: string) => {
    if (!isTargetOwned) {
      sfx.playBad();
      showToast(`Adopsi ${targetPetDef.name} terlebih dahulu dengan Treat!`);
      return;
    }
    const owned = targetPetSave.inventory[category].includes(itemId);
    if (owned) {
      const worn = targetPetSave.equipped[category] === itemId;
      equipAccessory(selectedPetId, category, worn ? undefined : itemId);
    } else {
      const res = buyAccessory(selectedPetId, category, itemId);
      if (!res.ok) showToast(res.message);
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-24 md:pb-12">
      {/* Storefront Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#171713]/65">Toko PetCoin · 2 Mata Uang</p>
          <h1 className="flex items-center gap-2 font-display text-3xl sm:text-4xl font-extrabold">
            <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" aria-hidden="true" />
            Adopsi Pet &amp; Butik Gaya
          </h1>
          <p className="text-sm text-[#171713]/80 mt-1">
            Gunakan <strong>Treat 🍪</strong> untuk adopsi hewan baru, dan <strong>Coin 🪙</strong> untuk membeli aksesori serta mainan.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              sfx.playPop();
              setTab('adopt');
            }}
            className={`neo-btn px-4 py-2.5 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'adopt' ? 'bg-[#ffd86b]' : 'bg-[#fffaf0]'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Adopsi Hewan (🍪 Treat)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.playPop();
              setTab('accessories');
            }}
            className={`neo-btn px-4 py-2.5 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'accessories' ? 'bg-[#ff8fb3]' : 'bg-[#fffaf0]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Butik Aksesori (🪙 Coin)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ADOPSI HEWAN DENGAN TREAT */}
      {tab === 'adopt' && (
        <section aria-label="Katalog adopsi hewan" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <span>
              Dimiliki: <strong className="font-mono-num">{state.ownedPets.length} / {PET_CATALOG.length}</strong> Pet
            </span>
            <span className="font-mono-num bg-[#fffaf0] border-2 border-[#171713] px-3 py-1">
              Saldo Treat Kamu: 🍪 {state.treats}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PET_CATALOG.map(pet => {
              const owned = state.ownedPets.includes(pet.id);
              const affordable = state.treats >= pet.priceTreats;
              const petSave = state.pets[pet.id];

              return (
                <article
                  key={pet.id}
                  className="neo-card p-5 flex flex-col justify-between gap-4"
                  style={{ backgroundColor: pet.cardBg }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span>{pet.rarity}</span>
                      <span className="font-mono-num">
                        {owned ? `Dimiliki · LVL ${String(petSave.level).padStart(2, '0')}` : 'Belum Dimiliki'}
                      </span>
                    </div>

                    <div className="h-40 bg-[#fffaf0]/65 border-2 border-[#171713] flex items-center justify-center p-2">
                      <img
                        src={pngUrl(pet.sprites.normal)}
                        alt={pet.name}
                        referrerPolicy="no-referrer"
                        className="max-h-full object-contain drop-shadow-[3px_4px_0_rgba(23,23,19,0.28)]"
                      />
                    </div>

                    <div>
                      <h2 className="font-display text-2xl font-extrabold">{pet.name}</h2>
                      <p className="text-xs font-semibold text-[#171713]/75">{pet.speciesLabel}</p>
                    </div>
                    <p className="text-xs text-[#171713]/85 leading-relaxed">{pet.tagline}</p>
                    <div className="bg-[#fffaf0] border border-[#171713] px-2.5 py-1.5 text-[11px] font-bold">
                      Keahlian: {pet.perkLabel}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t-2 border-[#171713]/20">
                    <div className="font-mono-num text-sm font-extrabold">
                      {pet.priceTreats === 0 ? 'FREE · Starter' : `🍪 ${pet.priceTreats} Treat`}
                    </div>

                    {owned ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActivePet(pet.id);
                          onNavigate('care');
                        }}
                        className="neo-btn bg-[#8be084] px-4 py-2 text-xs font-extrabold whitespace-nowrap"
                      >
                        Rawat Sekarang →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAdopt(pet.id)}
                        className={`neo-btn px-4 py-2 text-xs font-extrabold whitespace-nowrap ${
                          affordable ? 'bg-[#ffd86b]' : 'bg-[#fffaf0]'
                        }`}
                      >
                        {affordable ? `Adopsi · 🍪 ${pet.priceTreats}` : `Butuh ${pet.priceTreats} 🍪`}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: BUTIK AKSESORI DENGAN COIN */}
      {tab === 'accessories' && (
        <section aria-label="Butik aksesori" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Live Dressing Preview */}
          <div className="lg:col-span-4 neo-card p-5 bg-[#fffaf0] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#171713]/65">Pratinjau Pet</p>
                <h2 className="font-display text-xl font-extrabold">{targetPetDef.name}</h2>
              </div>
              <span className="font-mono-num text-xs font-extrabold bg-[#fff3a6] border-2 border-[#171713] px-2.5 py-1">
                🪙 {state.coins}
              </span>
            </div>

            {/* Pet selector pills */}
            <div className="flex flex-wrap gap-1.5">
              {PET_CATALOG.map(p => {
                const owned = state.ownedPets.includes(p.id);
                const selected = selectedPetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      sfx.playPop();
                      setSelectedPetId(p.id);
                    }}
                    className={`neo-btn px-2.5 py-1 text-xs font-bold ${
                      selected ? 'bg-[#ffd86b]' : 'bg-[#f5efdf]'
                    } ${owned ? '' : 'opacity-60'}`}
                  >
                    {p.name} {owned ? '' : '🔒'}
                  </button>
                );
              })}
            </div>

            <div
              className="h-56 border-2 border-[#171713] room-grid-bg flex items-center justify-center p-3"
              style={{ backgroundColor: targetPetDef.cardBg }}
            >
              <PetAvatar
                petId={selectedPetId}
                mood="happy"
                equipped={targetPetSave.equipped}
                className="w-44 h-44"
              />
            </div>

            {!isTargetOwned && (
              <div className="bg-[#ffe28a] border-2 border-[#171713] p-3 text-xs font-bold">
                Adopsi {targetPetDef.name} dulu dengan {targetPetDef.priceTreats} Treat agar bisa memakai item!
              </div>
            )}
          </div>

          {/* Right: Items Grid */}
          <div className="lg:col-span-8 neo-card p-5 bg-[#fffaf0] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {[
                  { id: 'hair' as AccessoryCategory, label: 'Rambut' },
                  { id: 'accessories' as AccessoryCategory, label: 'Aksesori' },
                  { id: 'playTools' as AccessoryCategory, label: 'Mainan' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      sfx.playPop();
                      setCatTab(cat.id);
                    }}
                    className={`neo-btn px-3.5 py-2 text-xs font-extrabold ${
                      catTab === cat.id ? 'bg-[#7bd3ea]' : 'bg-[#f5efdf]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {targetPetSave.equipped[catTab] && (
                <button
                  type="button"
                  onClick={() => equipAccessory(selectedPetId, catTab, undefined)}
                  className="text-xs font-bold underline cursor-pointer"
                >
                  Lepas item terpasang
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {catTab === 'hair' &&
                targetPetDef.hairAssets.map(item => {
                  const owned = targetPetSave.inventory.hair.includes(item.id);
                  const worn = targetPetSave.equipped.hair === item.id;
                  return (
                    <article key={item.id} className="neo-card-sm bg-[#f5efdf] p-4 flex flex-col justify-between gap-3">
                      <div className="space-y-2 text-center">
                        <img
                          src={pngUrl(item.normal)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-24 h-24 mx-auto object-contain"
                        />
                        <h3 className="font-display text-base font-extrabold">{item.name}</h3>
                        <p className="font-mono-num text-xs font-bold">
                          {owned ? (worn ? 'Sedang dipakai' : 'Sudah dimiliki') : `🪙 ${item.priceCoins} Coin`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBuyOrEquip('hair', item.id)}
                        className={`neo-btn w-full py-2 text-xs font-extrabold flex items-center justify-center gap-1 ${
                          worn ? 'bg-[#8be084]' : owned ? 'bg-[#fffaf0]' : 'bg-[#ffd86b]'
                        }`}
                      >
                        {worn ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Lepas</span>
                          </>
                        ) : owned ? (
                          <span>Pakai</span>
                        ) : (
                          <span>Beli · 🪙 {item.priceCoins}</span>
                        )}
                      </button>
                    </article>
                  );
                })}

              {catTab === 'accessories' &&
                targetPetDef.accessoryAssets.map(item => {
                  const owned = targetPetSave.inventory.accessories.includes(item.id);
                  const worn = targetPetSave.equipped.accessories === item.id;
                  return (
                    <article key={item.id} className="neo-card-sm bg-[#f5efdf] p-4 flex flex-col justify-between gap-3">
                      <div className="space-y-2 text-center">
                        <img
                          src={pngUrl(item.image)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-24 h-24 mx-auto object-contain"
                        />
                        <h3 className="font-display text-base font-extrabold">{item.name}</h3>
                        <p className="font-mono-num text-xs font-bold">
                          {owned ? (worn ? 'Sedang dipakai' : 'Sudah dimiliki') : `🪙 ${item.priceCoins} Coin`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBuyOrEquip('accessories', item.id)}
                        className={`neo-btn w-full py-2 text-xs font-extrabold flex items-center justify-center gap-1 ${
                          worn ? 'bg-[#8be084]' : owned ? 'bg-[#fffaf0]' : 'bg-[#ff8fb3]'
                        }`}
                      >
                        {worn ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Lepas</span>
                          </>
                        ) : owned ? (
                          <span>Pakai</span>
                        ) : (
                          <span>Beli · 🪙 {item.priceCoins}</span>
                        )}
                      </button>
                    </article>
                  );
                })}

              {catTab === 'playTools' &&
                PLAY_TOOLS.map(item => {
                  const owned = targetPetSave.inventory.playTools.includes(item.id);
                  const worn = targetPetSave.equipped.playTools === item.id;
                  return (
                    <article key={item.id} className="neo-card-sm bg-[#f5efdf] p-4 flex flex-col justify-between gap-3">
                      <div className="space-y-2 text-center">
                        <img
                          src={pngUrl(item.image)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-24 h-24 mx-auto object-contain"
                        />
                        <h3 className="font-display text-base font-extrabold">{item.name}</h3>
                        <p className="font-mono-num text-xs font-bold">
                          {owned ? (worn ? 'Sedang dibawa' : 'Sudah dimiliki') : `🪙 ${item.priceCoins} Coin`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBuyOrEquip('playTools', item.id)}
                        className={`neo-btn w-full py-2 text-xs font-extrabold flex items-center justify-center gap-1 ${
                          worn ? 'bg-[#8be084]' : owned ? 'bg-[#fffaf0]' : 'bg-[#7bd3ea]'
                        }`}
                      >
                        {worn ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Lepas</span>
                          </>
                        ) : owned ? (
                          <span>Pakai</span>
                        ) : (
                          <span>Beli · 🪙 {item.priceCoins}</span>
                        )}
                      </button>
                    </article>
                  );
                })}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#171713]/75">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Mainkan Mini Game kalau Coin kurang!
              </span>
              <button
                type="button"
                onClick={() => onNavigate('minigames')}
                className="font-extrabold text-[#171713] underline cursor-pointer"
              >
                Cari Coin di Mini Game →
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
