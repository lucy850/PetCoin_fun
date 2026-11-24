import { useCallback, useEffect, useRef, useState } from 'react';
import { LogOut, Send, Sparkles, Users, Wifi, WifiOff } from 'lucide-react';
import { PET_BY_ID, PET_CATALOG, pngUrl } from '../data/catalog';
import { useGameStore } from '../hooks/useGameStore';
import { PetEquipped, PetId } from '../types/game';
import { sfx } from '../utils/sound';
import { PetAvatar } from './PetAvatar';

interface RemotePlayer {
  id: string;
  name: string;
  petId: PetId;
  level: number;
  equipped: PetEquipped;
  x: number;
  y: number;
  color: string;
}

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  petId: string;
  text: string;
  system: boolean;
  timestamp: number;
}

const NAME_STORAGE_KEY = 'petcoin_playground_name';
const EMOTES = [
  { icon: '👋', label: 'Halo' },
  { icon: '♥', label: 'Love' },
  { icon: '🎉', label: 'Seru!' },
  { icon: '🍪', label: 'Lapar' },
  { icon: '🪙', label: 'Kaya!' },
  { icon: '😂', label: 'Wkwk' },
];

function getWsUrl(): string {
  const custom = import.meta.env.VITE_WS_URL as string | undefined;
  if (custom) return custom;
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

export function PlaygroundView() {
  const { state, activePet, setActivePet, showToast, spawnJuice } = useGameStore();

  const [nickname, setNickname] = useState<string>(() => {
    try {
      return localStorage.getItem(NAME_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [nameError, setNameError] = useState('');
  const [joined, setJoined] = useState(false);
  const [connState, setConnState] = useState<'idle' | 'connecting' | 'connected' | 'reconnecting'>('idle');
  const [serverOnlineHint, setServerOnlineHint] = useState<number | null>(null);

  const [selfId, setSelfId] = useState<string>('');
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ball, setBall] = useState<{ x: number; y: number }>({ x: 50, y: 52 });
  const [chatInput, setChatInput] = useState('');

  // Transient bubbles & hops per playerId
  const [activeEmotes, setActiveEmotes] = useState<Record<string, string>>({});
  const [speechBubbles, setSpeechBubbles] = useState<Record<string, string>>({});
  const [hopSeq, setHopSeq] = useState<Record<string, number>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const intentionalCloseRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const lastMoveSentRef = useRef(0);
  const joinedNameRef = useRef('');

  // Check initial online count before joining
  useEffect(() => {
    if (joined) return;
    fetch('/api/playground/status')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && typeof data.online === 'number') setServerOnlineHint(data.online);
      })
      .catch(() => {
        // Fallback when running behind Caddy+Go directly (/healthz)
        fetch('/healthz')
          .then(r => (r.ok ? r.json() : null))
          .then(data => {
            if (data && typeof data.online === 'number') setServerOnlineHint(data.online);
          })
          .catch(() => {});
      });
  }, [joined]);

  // Auto-scroll chat feed
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendWs = useCallback((type: string, payload: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const connectAndJoin = useCallback(
    (nameToUse: string) => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (wsRef.current) {
        intentionalCloseRef.current = true;
        wsRef.current.close();
      }

      intentionalCloseRef.current = false;
      setConnState(joined ? 'reconnecting' : 'connecting');

      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'join',
            payload: {
              name: nameToUse,
              petId: state.activePetId,
              level: activePet.level,
              equipped: activePet.equipped,
            },
          }),
        );
      };

      ws.onmessage = event => {
        let msg: { type: string; payload: Record<string, unknown> };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (msg.type) {
          case 'init': {
            const p = msg.payload as {
              selfId: string;
              players: RemotePlayer[];
              messages: ChatMessage[];
              ball: { x: number; y: number };
            };
            setSelfId(p.selfId);
            setPlayers(p.players || []);
            setMessages(p.messages || []);
            if (p.ball) setBall(p.ball);
            setJoined(true);
            setConnState('connected');
            sfx.playUnlock();
            break;
          }

          case 'player_joined': {
            const p = msg.payload as { player: RemotePlayer; systemMessage?: ChatMessage };
            setPlayers(prev => (prev.some(item => item.id === p.player.id) ? prev : [...prev, p.player]));
            if (p.systemMessage) {
              setMessages(prev => [...prev.slice(-49), p.systemMessage!]);
            }
            sfx.playPop();
            break;
          }

          case 'player_left': {
            const p = msg.payload as { playerId: string; systemMessage?: ChatMessage };
            setPlayers(prev => prev.filter(item => item.id !== p.playerId));
            if (p.systemMessage) {
              setMessages(prev => [...prev.slice(-49), p.systemMessage!]);
            }
            break;
          }

          case 'player_moved': {
            const p = msg.payload as { playerId: string; x: number; y: number };
            setPlayers(prev =>
              prev.map(item => (item.id === p.playerId ? { ...item, x: p.x, y: p.y } : item)),
            );
            break;
          }

          case 'player_emote': {
            const p = msg.payload as { playerId: string; emote: string };
            setActiveEmotes(prev => ({ ...prev, [p.playerId]: p.emote }));
            sfx.playPetHappy(2);
            window.setTimeout(() => {
              setActiveEmotes(prev => {
                if (prev[p.playerId] !== p.emote) return prev;
                const next = { ...prev };
                delete next[p.playerId];
                return next;
              });
            }, 2400);
            break;
          }

          case 'player_hop': {
            const p = msg.payload as { playerId: string };
            setHopSeq(prev => ({ ...prev, [p.playerId]: (prev[p.playerId] || 0) + 1 }));
            sfx.playPop();
            break;
          }

          case 'chat_message': {
            const p = msg.payload as { message: ChatMessage };
            setMessages(prev =>
              prev.some(m => m.id === p.message.id) ? prev : [...prev.slice(-49), p.message],
            );
            if (!p.message.system) {
              setSpeechBubbles(prev => ({ ...prev, [p.message.playerId]: p.message.text }));
              sfx.playPop();
              window.setTimeout(() => {
                setSpeechBubbles(prev => {
                  if (prev[p.message.playerId] !== p.message.text) return prev;
                  const next = { ...prev };
                  delete next[p.message.playerId];
                  return next;
                });
              }, 4500);
            }
            break;
          }

          case 'ball_moved': {
            const p = msg.payload as { x: number; y: number; kickerId: string };
            setBall({ x: p.x, y: p.y });
            sfx.playCoin(3);
            break;
          }

          case 'error': {
            const p = msg.payload as { message: string };
            setNameError(p.message || 'Gagal masuk ke playground.');
            setConnState('idle');
            break;
          }
        }
      };

      ws.onclose = () => {
        if (intentionalCloseRef.current) {
          setConnState('idle');
          return;
        }
        setConnState('reconnecting');
        reconnectTimerRef.current = window.setTimeout(() => {
          if (joinedNameRef.current) {
            connectAndJoin(joinedNameRef.current);
          }
        }, 1800);
      };
    },
    [activePet.equipped, activePet.level, joined, state.activePetId],
  );

  // Clean disconnect on unmount
  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleEnterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nickname.trim();
    if (cleaned.length < 2 || cleaned.length > 20) {
      sfx.playBad();
      setNameError('Masukkan nama panggilan 2–20 karakter.');
      return;
    }
    setNameError('');
    try {
      localStorage.setItem(NAME_STORAGE_KEY, cleaned);
    } catch {
      // ignore
    }
    joinedNameRef.current = cleaned;
    connectAndJoin(cleaned);
  };

  const handleLeave = () => {
    sfx.playPop();
    intentionalCloseRef.current = true;
    joinedNameRef.current = '';
    if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
    if (wsRef.current) wsRef.current.close();
    wsRef.current = null;
    setJoined(false);
    setConnState('idle');
    setPlayers([]);
  };

  const moveSelfTo = useCallback(
    (xPct: number, yPct: number) => {
      const clampedX = Math.max(7, Math.min(93, xPct));
      const clampedY = Math.max(16, Math.min(88, yPct));

      // Optimistic local update
      setPlayers(prev =>
        prev.map(p => (p.id === selfId ? { ...p, x: clampedX, y: clampedY } : p)),
      );

      const now = Date.now();
      if (now - lastMoveSentRef.current >= 45) {
        lastMoveSentRef.current = now;
        sendWs('move', { x: clampedX, y: clampedY });
      }
    },
    [selfId, sendWs],
  );

  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!arenaRef.current || !joined) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    moveSelfTo(xPct, yPct);
    spawnJuice(e.clientX, e.clientY, '🐾', 'xp');
  };

  const handleKickBall = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const nextX = 14 + Math.random() * 72;
    const nextY = 22 + Math.random() * 62;
    setBall({ x: nextX, y: nextY });
    sendWs('ball_kick', { x: nextX, y: nextY });
    spawnJuice(e.clientX, e.clientY, 'Tendang! ⚽', 'coin');
  };

  // Keyboard WASD / Arrow navigation when not typing in chat input
  useEffect(() => {
    if (!joined) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const me = players.find(p => p.id === selfId);
      if (!me) return;

      const step = 4.5;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        moveSelfTo(me.x, me.y - step);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        moveSelfTo(me.x, me.y + step);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveSelfTo(me.x - step, me.y);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveSelfTo(me.x + step, me.y);
      } else if (e.key === ' ') {
        e.preventDefault();
        sendWs('hop', {});
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [joined, players, selfId, moveSelfTo, sendWs]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    if (trimmed.length > 160) {
      showToast('Pesan maksimal 160 karakter.');
      return;
    }
    sendWs('chat', { text: trimmed });
    setChatInput('');
  };

  const handleSendEmote = (emote: string) => {
    sendWs('emote', { emote });
  };

  const handleHop = () => {
    sendWs('hop', {});
  };

  // --- NAME ENTRY SCREEN BEFORE ENTERING PLAYGROUND ---
  if (!joined) {
    const activeDef = PET_BY_ID[state.activePetId];
    return (
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          <form
            onSubmit={handleEnterSubmit}
            className="md:col-span-7 neo-card p-6 sm:p-8 bg-[#fffaf0] flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#171713]/70">Multiplayer WebSocket · Real-Time</span>
                {serverOnlineHint !== null && (
                  <span className="font-mono-num text-xs font-extrabold bg-[#8be084] border border-[#171713] px-2.5 py-0.5">
                    {serverOnlineHint} Pemain Online
                  </span>
                )}
              </div>

              <h1 className="flex items-center gap-2 font-display text-3xl sm:text-4xl font-extrabold">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" aria-hidden="true" />
                PetCoin Playground
              </h1>
              <p className="text-sm text-[#171713]/80 leading-relaxed">
                Masuk ke taman bermain bersama pet kesayanganmu! Jalan-jalan, main bola bareng, kirim reaksi lucu, dan ngobrol real-time dengan pemain lain.
              </p>

              <div className="pt-2 space-y-2">
                <label htmlFor="playground-nickname" className="block text-xs font-extrabold">
                  Masukkan Nama Panggilanmu Sebelum Masuk
                </label>
                <input
                  id="playground-nickname"
                  type="text"
                  maxLength={20}
                  value={nickname}
                  onChange={e => {
                    setNickname(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="Contoh: Ira, Rangga, Peto..."
                  className="w-full border-2 border-[#171713] bg-[#f5efdf] px-4 py-3 text-sm font-bold focus:outline-none focus:bg-white shadow-[3px_3px_0_#171713]"
                />
                {nameError && <p className="text-xs font-bold text-[#b91c1c]">{nameError}</p>}
              </div>

              {state.ownedPets.length > 1 && (
                <div className="pt-2 space-y-2">
                  <div className="text-xs font-extrabold">Pilih Pet yang Dibawa:</div>
                  <div className="flex flex-wrap gap-2">
                    {PET_CATALOG.filter(p => state.ownedPets.includes(p.id)).map(pet => (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => setActivePet(pet.id)}
                        className={`neo-btn px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 ${
                          state.activePetId === pet.id ? 'bg-[#ffd86b]' : 'bg-[#f5efdf]'
                        }`}
                      >
                        <img
                          src={pngUrl(pet.sprites.normal)}
                          alt={pet.name}
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 object-contain"
                        />
                        <span>{pet.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={connState === 'connecting'}
              className="neo-btn bg-[#8be084] w-full py-3.5 text-base font-extrabold flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              <span>{connState === 'connecting' ? 'Menghubungkan...' : 'Masuk Playground →'}</span>
            </button>
          </form>

          <div
            className="md:col-span-5 neo-card p-6 flex flex-col items-center justify-center text-center room-grid-bg space-y-4"
            style={{ backgroundColor: activeDef.cardBg }}
          >
            <span className="bg-[#fffaf0] border-2 border-[#171713] px-3 py-1 text-xs font-extrabold shadow-[2px_2px_0_#171713]">
              Partner Bermain: {activeDef.name}
            </span>
            <PetAvatar
              petId={state.activePetId}
              mood="happy"
              equipped={activePet.equipped}
              className="w-44 h-44"
            />
            <p className="text-xs font-bold bg-[#fffaf0] border-2 border-[#171713] px-3 py-2 shadow-[2px_2px_0_#171713]">
              Aksesori &amp; gaya rambut yang kamu pakai akan tampil langsung untuk semua pemain!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE PLAYGROUND ARENA + REAL-TIME CHAT ---
  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-4 pb-24 md:pb-12">
      {/* Top Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="flex items-center gap-2 font-display text-2xl sm:text-3xl font-extrabold">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" aria-hidden="true" />
            PetCoin Playground
          </h1>
          <span
            className={`font-mono-num text-xs font-extrabold border-2 border-[#171713] px-2.5 py-1 flex items-center gap-1.5 ${
              connState === 'connected' ? 'bg-[#8be084]' : 'bg-[#ffd86b]'
            }`}
          >
            {connState === 'connected' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>
              {connState === 'connected' ? `Online · ${players.length} Pemain` : 'Menghubungkan ulang...'}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleLeave}
          className="neo-btn bg-[#ff8fb3] px-3.5 py-2 text-xs font-extrabold flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Playground</span>
        </button>
      </div>

      {/* Main Split: Park Arena + Chat Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Interactive 2D Park */}
        <section className="lg:col-span-8 flex flex-col gap-3">
          <div
            ref={arenaRef}
            onClick={handleArenaClick}
            role="application"
            aria-label="Arena Playground PetCoin, klik untuk menggerakkan pet"
            className="relative h-[400px] sm:h-[470px] neo-card bg-[#d9f7cb] room-grid-bg overflow-hidden cursor-crosshair select-none"
          >
            {/* Park Scenery Props */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-6 top-6 w-28 h-16 border-2 border-[#171713] bg-[#ffd86b]/70 shadow-[3px_3px_0_#171713] flex items-center justify-center text-[10px] font-extrabold"
            >
              ZONA PIKNIK
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-6 top-6 w-20 h-20 rounded-full border-2 border-[#171713] bg-[#7bd3ea]/80 shadow-[3px_3px_0_#171713] flex items-center justify-center text-[10px] font-extrabold text-center leading-tight"
            >
              AIR MANCUR
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 left-4 text-[11px] font-bold bg-[#fffaf0]/90 border border-[#171713] px-2.5 py-1"
            >
              Klik taman / WASD untuk jalan · Spasi untuk lompat · Klik bola untuk menendang!
            </div>

            {/* Shared Server-Synced Beach Ball */}
            <button
              type="button"
              onClick={handleKickBall}
              aria-label="Tendang bola playground"
              style={{
                left: `${ball.x}%`,
                top: `${ball.y}%`,
                transition: 'left 380ms cubic-bezier(0.16, 1, 0.3, 1), top 380ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border-2 border-[#171713] bg-[#fffaf0] shadow-[2px_2px_0_#171713] flex items-center justify-center text-xl hover:scale-110 cursor-pointer"
            >
              ⚽
            </button>

            {/* All Connected Players */}
            {players.map(player => {
              const isSelf = player.id === selfId;
              const emote = activeEmotes[player.id];
              const bubble = speechBubbles[player.id];
              const hop = hopSeq[player.id] || 0;

              return (
                <div
                  key={player.id}
                  style={{
                    left: `${player.x}%`,
                    top: `${player.y}%`,
                    transition: 'left 260ms ease-out, top 260ms ease-out',
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none ${
                    isSelf ? 'z-30' : 'z-20'
                  }`}
                >
                  {/* Chat Speech Bubble */}
                  {bubble && (
                    <div className="mb-1 max-w-[170px] bg-[#fffaf0] border-2 border-[#171713] px-2.5 py-1 text-[11px] font-bold shadow-[2px_2px_0_#171713] text-center break-words">
                      {bubble}
                    </div>
                  )}

                  {/* Emote Pop */}
                  {emote && (
                    <div className="mb-1 bg-[#ffd86b] border-2 border-[#171713] px-2 py-0.5 text-base shadow-[2px_2px_0_#171713]">
                      {emote}
                    </div>
                  )}

                  {/* Pet Sprite */}
                  <PetAvatar
                    petId={player.petId}
                    mood={emote === '♥' || emote === '🎉' ? 'happy' : 'normal'}
                    equipped={player.equipped || {}}
                    squishKey={hop}
                    className="w-16 h-16 sm:w-20 sm:h-20"
                  />

                  {/* Nameplate */}
                  <div
                    style={{ backgroundColor: player.color }}
                    className="mt-0.5 border-2 border-[#171713] px-2 py-0.5 text-[10px] font-extrabold shadow-[2px_2px_0_#171713] whitespace-nowrap flex items-center gap-1"
                  >
                    <span>{player.name}</span>
                    {isSelf && <span>(Kamu)</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Emotes & Hop Bar */}
          <div className="neo-card bg-[#fffaf0] p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {EMOTES.map(em => (
                <button
                  key={em.icon}
                  type="button"
                  onClick={() => handleSendEmote(em.icon)}
                  className="neo-btn bg-[#f5efdf] px-2.5 py-1.5 text-xs font-extrabold whitespace-nowrap"
                >
                  {em.icon} {em.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleHop}
              className="neo-btn bg-[#ffd86b] px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lompat! (Spasi)</span>
            </button>
          </div>
        </section>

        {/* Right: Online Players + Real-Time Chat */}
        <aside className="lg:col-span-4 neo-card bg-[#fffaf0] p-4 flex flex-col justify-between h-[460px] lg:h-auto lg:max-h-[545px]">
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            {/* Online Roster */}
            <div className="pb-2.5 border-b-2 border-[#171713]/15 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span>Pemain di Taman</span>
                <span className="font-mono-num">{players.length} Online</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {players.map(p => (
                  <span
                    key={p.id}
                    style={{ backgroundColor: p.color }}
                    className="inline-flex items-center gap-1 border border-[#171713] px-2 py-0.5 text-[11px] font-bold"
                  >
                    <img
                      src={pngUrl(PET_BY_ID[p.petId]?.sprites.normal || 'kucing123.png')}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 object-contain"
                    />
                    <span>{p.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`text-xs leading-snug p-2 border ${
                    msg.system
                      ? 'bg-[#f5efdf] border-[#171713]/20 text-[#171713]/75 italic'
                      : msg.playerId === selfId
                        ? 'bg-[#ffe28a] border-[#171713]'
                        : 'bg-white border-[#171713]'
                  }`}
                >
                  {!msg.system && (
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-extrabold">{msg.playerName}</span>
                      <span className="font-mono-num text-[10px] text-[#171713]/60">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                  <p className="break-words font-medium">{msg.text}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="pt-3 mt-2 border-t-2 border-[#171713]/15 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              maxLength={160}
              placeholder="Tulis pesan chat..."
              aria-label="Tulis pesan chat"
              className="flex-1 min-w-0 border-2 border-[#171713] bg-[#f5efdf] px-3 py-2 text-xs font-bold focus:outline-none focus:bg-white"
            />
            <button
              type="submit"
              aria-label="Kirim pesan"
              className="neo-btn bg-[#7bd3ea] px-3.5 py-2 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
