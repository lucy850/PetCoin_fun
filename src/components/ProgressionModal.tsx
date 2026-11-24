import { Award, CalendarCheck2, Check, X } from 'lucide-react';
import { ACHIEVEMENTS, DAILY_STREAK_REWARDS } from '../data/catalog';
import { useGameStore } from '../hooks/useGameStore';
import { sfx } from '../utils/sound';

interface ProgressionModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProgressionModal({ open, onClose }: ProgressionModalProps) {
  const {
    state,
    claimDailyCheckIn,
    claimMission,
    getAchievementProgress,
    claimAchievement,
  } = useGameStore();

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="missions-title"
      className="fixed inset-0 z-50 bg-[#171713]/60 flex items-center justify-center p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="neo-card bg-[#fffaf0] w-full max-w-2xl max-h-[88vh] overflow-y-auto p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 pb-3 border-b-2 border-[#171713]/15">
          <div>
            <p className="text-xs font-bold text-[#171713]/65">Progres &amp; Retensi</p>
            <h2 id="missions-title" className="font-display text-2xl font-extrabold">
              Bonus Harian, Misi &amp; Lencana
            </h2>
          </div>
          <button
            type="button"
            aria-label="Tutup jendela misi"
            onClick={() => {
              sfx.playPop();
              onClose();
            }}
            className="neo-btn bg-[#ff8fb3] w-9 h-9 flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7-Day Streak */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5" />
              <span>Bonus Check-In Harian (Hari Ke-{state.daily.streakDay})</span>
            </h3>
            {!state.daily.checkedInToday && (
              <button
                type="button"
                onClick={claimDailyCheckIn}
                className="neo-btn bg-[#8be084] px-3 py-1.5 text-xs font-extrabold"
              >
                Klaim Hari Ini!
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DAILY_STREAK_REWARDS.map(r => {
              const past = r.day < state.daily.streakDay || (r.day === state.daily.streakDay && state.daily.checkedInToday);
              const isToday = r.day === state.daily.streakDay && !state.daily.checkedInToday;
              return (
                <div
                  key={r.day}
                  className={`border-2 border-[#171713] p-2 text-center space-y-1 ${
                    past ? 'bg-[#8be084]' : isToday ? 'bg-[#ffd86b]' : 'bg-[#f5efdf]'
                  }`}
                >
                  <div className="font-mono-num text-[10px] font-extrabold">HARI {r.day}</div>
                  <div className="font-mono-num text-[11px] font-bold">🍪 {r.treats}</div>
                  <div className="font-mono-num text-[11px] font-bold">🪙 {r.coins}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Daily Missions */}
        <section className="space-y-3">
          <h3 className="font-display text-lg font-extrabold">Misi Harian</h3>
          <div className="space-y-2.5">
            {state.daily.missions.map(mission => {
              const ready = !mission.claimed && mission.progress >= mission.target;
              const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
              return (
                <div
                  key={mission.id}
                  className="border-2 border-[#171713] bg-[#f5efdf] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between text-sm font-extrabold">
                      <span>{mission.title}</span>
                      <span className="font-mono-num text-xs">
                        {mission.progress}/{mission.target}
                      </span>
                    </div>
                    <p className="text-xs text-[#171713]/75">{mission.description}</p>
                    <div className="h-2 bg-[#fffaf0] border border-[#171713]">
                      <div className="h-full bg-[#7bd3ea]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => claimMission(mission.id)}
                    className={`neo-btn px-3.5 py-2 text-xs font-extrabold whitespace-nowrap shrink-0 ${
                      mission.claimed ? 'bg-[#8be084]' : ready ? 'bg-[#ffd86b]' : 'bg-[#fffaf0]'
                    }`}
                  >
                    {mission.claimed ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Diklaim
                      </span>
                    ) : (
                      `Klaim +${mission.rewardAmount} ${mission.rewardType === 'treats' ? '🍪' : '🪙'}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Achievements */}
        <section className="space-y-3">
          <h3 className="font-display text-lg font-extrabold flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span>Lencana Kolektor ({state.claimedAchievements.length}/{ACHIEVEMENTS.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map(ach => {
              const claimed = state.claimedAchievements.includes(ach.id);
              const progress = Math.min(ach.target, getAchievementProgress(ach.id));
              const ready = !claimed && progress >= ach.target;
              return (
                <div
                  key={ach.id}
                  className="border-2 border-[#171713] bg-[#f5efdf] p-3.5 flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
                      <span>{ach.title}</span>
                      <span className="font-mono-num">
                        {progress}/{ach.target}
                      </span>
                    </div>
                    <p className="text-xs text-[#171713]/75 mt-1">{ach.description}</p>
                  </div>

                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => claimAchievement(ach.id)}
                    className={`neo-btn w-full py-1.5 text-xs font-extrabold ${
                      claimed ? 'bg-[#8be084]' : ready ? 'bg-[#ffd86b]' : 'bg-[#fffaf0]'
                    }`}
                  >
                    {claimed
                      ? 'Selesai ✓'
                      : `Hadiah: +${ach.rewardAmount} ${ach.rewardType === 'treats' ? '🍪' : '🪙'}`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
