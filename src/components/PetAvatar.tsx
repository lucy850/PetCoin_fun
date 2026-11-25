import { PET_BY_ID, PLAY_TOOLS, pngUrl } from '../data/catalog';
import { PetEquipped, PetId } from '../types/game';

interface PetAvatarProps {
  petId: PetId;
  mood: 'normal' | 'happy' | 'sad';
  equipped: PetEquipped;
  isDirty?: boolean;
  isFoamed?: boolean;
  isWet?: boolean;
  isSleeping?: boolean;
  isMasked?: boolean;
  squishKey?: number;
  className?: string;
}

export function PetAvatar({
  petId,
  mood,
  equipped,
  isDirty = false,
  isFoamed = false,
  isWet = false,
  isSleeping = false,
  isMasked = false,
  squishKey = 0,
  className = '',
}: PetAvatarProps) {
  const petDef = PET_BY_ID[petId];
  const hair = petDef.hairAssets.find(h => h.id === equipped.hair);
  const accessory = petDef.accessoryAssets.find(a => a.id === equipped.accessories);
  const tool = PLAY_TOOLS.find(t => t.id === equipped.playTools);

  let baseSprite = petDef.sprites[mood];
  if (hair) {
    baseSprite = mood === 'happy' ? hair.happy : mood === 'sad' ? hair.sad : hair.normal;
  }

  const idleClass = isSleeping
    ? ''
    : mood === 'sad'
      ? 'animate-pet-sad'
      : 'animate-pet-breathe';

  return (
    <div
      key={squishKey}
      className={`relative select-none flex items-center justify-center ${
        squishKey > 0 ? 'animate-pet-squish' : idleClass
      } ${className}`}
    >
      <img
        src={pngUrl(baseSprite)}
        alt={petDef.name}
        referrerPolicy="no-referrer"
        draggable={false}
        className={`w-full h-full object-contain pointer-events-none drop-shadow-[4px_5px_0_rgba(23,23,19,0.28)] transition-[filter] duration-200 ${
          isWet ? 'brightness-105 saturate-75' : ''
        }`}
      />

      {accessory && (
        <img
          src={pngUrl(accessory.image)}
          alt={accessory.name}
          referrerPolicy="no-referrer"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      )}

      {tool && (
        <img
          src={pngUrl(tool.image)}
          alt={tool.name}
          referrerPolicy="no-referrer"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      )}

      {isDirty && (
        <div
          aria-hidden="true"
          className="absolute inset-[14%] pointer-events-none opacity-75"
          style={{
            background:
              'radial-gradient(circle at 28% 38%, rgba(128,82,47,0.7) 0 8px, transparent 10px), radial-gradient(circle at 68% 34%, rgba(112,69,38,0.72) 0 10px, transparent 12px), radial-gradient(circle at 72% 62%, rgba(147,97,58,0.75) 0 8px, transparent 10px), radial-gradient(circle at 36% 68%, rgba(112,69,38,0.7) 0 9px, transparent 11px)',
          }}
        />
      )}

      {isWet && (
        <div
          aria-hidden="true"
          className="absolute inset-[10%] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 25% 28%, #43c6e0 0 4px, transparent 5px), radial-gradient(circle at 74% 38%, #43c6e0 0 4px, transparent 5px), radial-gradient(circle at 46% 72%, #43c6e0 0 4px, transparent 5px), radial-gradient(circle at 66% 66%, #8ce6ef 0 3px, transparent 4px)',
          }}
        />
      )}

      {isFoamed && (
        <div
          aria-hidden="true"
          className="absolute inset-[12%] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 24% 58%, #ffffff 0 18px, #83dce8 19px 21px, transparent 22px), radial-gradient(circle at 44% 44%, #ffffff 0 22px, #83dce8 23px 25px, transparent 26px), radial-gradient(circle at 64% 54%, #ffffff 0 19px, #83dce8 20px 22px, transparent 23px), radial-gradient(circle at 76% 42%, #ffffff 0 15px, #83dce8 16px 18px, transparent 19px)',
          }}
        />
      )}

      {isMasked && (
        <div
          aria-hidden="true"
          className="absolute top-[33%] left-1/2 -translate-x-1/2 w-[38%] h-[13%] rounded-full border-2 border-[#171713] bg-[#ff8fb3] shadow-[2px_2px_0_#171713] flex items-center justify-around px-2"
        >
          <span className="w-2.5 h-1 border-b-2 border-[#171713] rounded-full" />
          <span className="w-2.5 h-1 border-b-2 border-[#171713] rounded-full" />
        </div>
      )}

      {isSleeping && (
        <div aria-hidden="true" className="absolute -top-2 right-[12%] pointer-events-none flex flex-col items-end">
          <span className="animate-zzz font-display font-extrabold text-lg text-[#171713] bg-[#fffaf0] border-2 border-[#171713] px-1.5 py-0.5 shadow-[2px_2px_0_#171713]">
            Zzz
          </span>
        </div>
      )}
    </div>
  );
}
