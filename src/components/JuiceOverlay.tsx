import { useGameStore } from '../hooks/useGameStore';

const TONE_CLASSES: Record<string, string> = {
  treat: 'bg-[#ffd86b] text-[#171713]',
  coin: 'bg-[#fff3a6] text-[#171713]',
  love: 'bg-[#ff8fb3] text-[#171713]',
  xp: 'bg-[#8be084] text-[#171713]',
  clean: 'bg-[#7bd3ea] text-[#171713]',
  bad: 'bg-[#ff7f6b] text-[#171713]',
};

export function JuiceOverlay() {
  const { particles, toastMessage } = useGameStore();

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
        {particles.map(p => (
          <span
            key={p.id}
            style={{ left: `${p.x}px`, top: `${p.y}px` }}
            className={`animate-float-up fixed inline-block border-2 border-[#171713] px-2.5 py-1 text-xs font-extrabold shadow-[2px_2px_0_#171713] whitespace-nowrap ${
              TONE_CLASSES[p.tone] || TONE_CLASSES.love
            }`}
          >
            {p.text}
          </span>
        ))}
      </div>

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 border-2 border-[#171713] bg-[#171713] text-[#fffaf0] px-4 py-2.5 text-sm font-semibold shadow-[4px_4px_0_#ffd86b] max-w-[92vw] text-center"
        >
          {toastMessage}
        </div>
      )}
    </>
  );
}
