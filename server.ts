import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

interface EquippedItems {
  hair?: string;
  accessories?: string;
  playTools?: string;
}

interface Player {
  id: string;
  name: string;
  petId: string;
  level: number;
  equipped: EquippedItems;
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

const VALID_PETS = new Set(['cat', 'elephant', 'bear', 'rabbit', 'chicken']);
const VALID_EMOTES = new Set(['👋', '♥', '🎉', '🍪', '🪙', '😂']);
const PALETTE = ['#ffd86b', '#ff8fb3', '#7bd3ea', '#8be084', '#d3b8ff', '#ffb3a7'];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  let seq = 0;
  const nextId = (prefix: string) => `${prefix}_${Date.now()}_${++seq}`;

  const players = new Map<WebSocket, Player>();
  const ball = { x: 50, y: 52 };
  const messages: ChatMessage[] = [
    {
      id: 'sys_welcome',
      playerId: 'system',
      playerName: 'PetCoin',
      petId: 'cat',
      text: 'Selamat datang di PetCoin Playground! Klik taman atau pakai WASD untuk berjalan, lalu sapa teman lain!',
      system: true,
      timestamp: Date.now(),
    },
  ];

  const pushMessage = (msg: ChatMessage) => {
    messages.push(msg);
    if (messages.length > 50) messages.shift();
  };

  const sendJSON = (ws: WebSocket, type: string, payload: unknown) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  };

  const broadcastJSON = (type: string, payload: unknown, exclude?: WebSocket) => {
    const raw = JSON.stringify({ type, payload });
    for (const [client] of players) {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  };

  wss.on('connection', ws => {
    ws.on('message', data => {
      let parsed: { type?: string; payload?: Record<string, unknown> };
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        return;
      }

      if (parsed.type === 'join') {
        if (players.has(ws)) return;
        const payload = parsed.payload || {};
        const name = String(payload.name || '').trim();
        if (name.length < 2 || name.length > 20) {
          sendJSON(ws, 'error', { message: 'Nama harus 2 sampai 20 karakter' });
          return;
        }
        const petId = VALID_PETS.has(String(payload.petId)) ? String(payload.petId) : 'cat';
        const level = Math.max(1, Number(payload.level) || 1);
        const equippedRaw = (payload.equipped as EquippedItems) || {};
        const equipped: EquippedItems = {
          hair: typeof equippedRaw.hair === 'string' ? equippedRaw.hair : undefined,
          accessories: typeof equippedRaw.accessories === 'string' ? equippedRaw.accessories : undefined,
          playTools: typeof equippedRaw.playTools === 'string' ? equippedRaw.playTools : undefined,
        };

        const player: Player = {
          id: nextId('pl'),
          name,
          petId,
          level,
          equipped,
          x: 20 + Math.random() * 60,
          y: 28 + Math.random() * 48,
          color: PALETTE[seq % PALETTE.length],
        };
        players.set(ws, player);

        const sysMsg: ChatMessage = {
          id: nextId('msg'),
          playerId: 'system',
          playerName: 'PetCoin',
          petId,
          text: `${name} bergabung bersama ${petId}!`,
          system: true,
          timestamp: Date.now(),
        };
        pushMessage(sysMsg);

        sendJSON(ws, 'init', {
          selfId: player.id,
          players: Array.from(players.values()),
          messages,
          ball,
        });

        broadcastJSON(
          'player_joined',
          {
            player,
            systemMessage: sysMsg,
          },
          ws,
        );
        return;
      }

      const player = players.get(ws);
      if (!player) return;

      if (parsed.type === 'move') {
        const x = clamp(Number(parsed.payload?.x) || player.x, 7, 93);
        const y = clamp(Number(parsed.payload?.y) || player.y, 16, 88);
        player.x = x;
        player.y = y;
        broadcastJSON('player_moved', { playerId: player.id, x, y }, ws);
      } else if (parsed.type === 'chat') {
        const text = String(parsed.payload?.text || '').trim();
        if (!text || text.length > 160) return;
        const msg: ChatMessage = {
          id: nextId('msg'),
          playerId: player.id,
          playerName: player.name,
          petId: player.petId,
          text,
          system: false,
          timestamp: Date.now(),
        };
        pushMessage(msg);
        broadcastJSON('chat_message', { message: msg });
      } else if (parsed.type === 'emote') {
        const emote = String(parsed.payload?.emote || '');
        if (!VALID_EMOTES.has(emote)) return;
        broadcastJSON('player_emote', { playerId: player.id, emote });
      } else if (parsed.type === 'hop') {
        broadcastJSON('player_hop', { playerId: player.id });
      } else if (parsed.type === 'ball_kick') {
        ball.x = clamp(Number(parsed.payload?.x) || 50, 10, 90);
        ball.y = clamp(Number(parsed.payload?.y) || 52, 18, 86);
        broadcastJSON('ball_moved', { x: ball.x, y: ball.y, kickerId: player.id });
      }
    });

    ws.on('close', () => {
      const left = players.get(ws);
      if (!left) return;
      players.delete(ws);
      const sysMsg: ChatMessage = {
        id: nextId('msg'),
        playerId: 'system',
        playerName: 'PetCoin',
        petId: left.petId,
        text: `${left.name} keluar dari playground.`,
        system: true,
        timestamp: Date.now(),
      };
      pushMessage(sysMsg);
      broadcastJSON('player_left', { playerId: left.id, systemMessage: sysMsg });
    });
  });

  app.get('/api/playground/status', (_req, res) => {
    res.json({ status: 'ok', online: players.size });
  });

  if (isProd) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`PetCoin server + WebSocket Playground listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error(err);
  process.exit(1);
});
