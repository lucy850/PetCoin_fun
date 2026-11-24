package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/gorilla/websocket"
)

type EquippedItems struct {
	Hair        string `json:"hair,omitempty"`
	Accessories string `json:"accessories,omitempty"`
	PlayTools   string `json:"playTools,omitempty"`
}

type Player struct {
	ID       string        `json:"id"`
	Name     string        `json:"name"`
	PetID    string        `json:"petId"`
	Level    int           `json:"level"`
	Equipped EquippedItems `json:"equipped"`
	X        float64       `json:"x"`
	Y        float64       `json:"y"`
	Color    string        `json:"color"`
}

type BallState struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type ChatMessage struct {
	ID         string `json:"id"`
	PlayerID   string `json:"playerId"`
	PlayerName string `json:"playerName"`
	PetID      string `json:"petId"`
	Text       string `json:"text"`
	System     bool   `json:"system"`
	Timestamp  int64  `json:"timestamp"`
}

type IncomingEnvelope struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type OutgoingEnvelope struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

type JoinPayload struct {
	Name     string        `json:"name"`
	PetID    string        `json:"petId"`
	Level    int           `json:"level"`
	Equipped EquippedItems `json:"equipped"`
}

type MovePayload struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type ChatPayload struct {
	Text string `json:"text"`
}

type EmotePayload struct {
	Emote string `json:"emote"`
}

type BallKickPayload struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	player *Player
}

type Hub struct {
	mu       sync.RWMutex
	clients  map[*Client]bool
	players  map[string]*Player
	messages []ChatMessage
	ball     BallState
	seq      int64
}

var playerPalette = []string{
	"#ffd86b", "#ff8fb3", "#7bd3ea", "#8be084", "#d3b8ff", "#ffb3a7",
}

var validPets = map[string]bool{
	"cat":      true,
	"elephant": true,
	"bear":     true,
	"rabbit":   true,
	"chicken":  true,
}

var validEmotes = map[string]bool{
	"👋": true, "♥": true, "🎉": true, "🍪": true, "🪙": true, "😂": true,
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[*Client]bool),
		players: make(map[string]*Player),
		messages: []ChatMessage{
			{
				ID:         "sys_welcome",
				PlayerID:   "system",
				PlayerName: "PetCoin",
				PetID:      "cat",
				Text:       "Selamat datang di PetCoin Playground! Klik taman atau pakai WASD untuk berjalan, lalu sapa teman lain!",
				System:     true,
				Timestamp:  time.Now().UnixMilli(),
			},
		},
		ball: BallState{X: 50, Y: 52},
	}
}

func clampCoord(v float64, minV float64, maxV float64) float64 {
	if v < minV {
		return minV
	}
	if v > maxV {
		return maxV
	}
	return v
}

func (h *Hub) nextID(prefix string) string {
	h.seq++
	return fmt.Sprintf("%s_%d_%d", prefix, time.Now().UnixMilli(), h.seq)
}

func (h *Hub) broadcastJSON(msg OutgoingEnvelope, exclude *Client) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	h.mu.RLock()
	targets := make([]*Client, 0, len(h.clients))
	for c := range h.clients {
		if c != exclude && c.player != nil {
			targets = append(targets, c)
		}
	}
	h.mu.RUnlock()

	for _, c := range targets {
		select {
		case c.send <- data:
		default:
			// Drop slow consumer message rather than blocking the hub
		}
	}
}

func (h *Hub) sendDirect(c *Client, msg OutgoingEnvelope) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	select {
	case c.send <- data:
	default:
	}
}

func (h *Hub) handleJoin(c *Client, raw json.RawMessage) {
	var p JoinPayload
	if err := json.Unmarshal(raw, &p); err != nil {
		h.sendDirect(c, OutgoingEnvelope{Type: "error", Payload: map[string]string{"message": "Payload join tidak valid"}})
		return
	}

	name := strings.TrimSpace(p.Name)
	nameLen := utf8.RuneCountInString(name)
	if nameLen < 2 || nameLen > 20 {
		h.sendDirect(c, OutgoingEnvelope{Type: "error", Payload: map[string]string{"message": "Nama harus 2 sampai 20 karakter"}})
		return
	}

	petID := p.PetID
	if !validPets[petID] {
		petID = "cat"
	}
	level := p.Level
	if level < 1 {
		level = 1
	}

	h.mu.Lock()
	if c.player != nil {
		h.mu.Unlock()
		return
	}
	playerID := h.nextID("pl")
	player := &Player{
		ID:       playerID,
		Name:     name,
		PetID:    petID,
		Level:    level,
		Equipped: p.Equipped,
		X:        20 + rand.Float64()*60,
		Y:        28 + rand.Float64()*48,
		Color:    playerPalette[int(h.seq)%len(playerPalette)],
	}
	c.player = player
	h.players[playerID] = player

	sysMsg := ChatMessage{
		ID:         h.nextID("msg"),
		PlayerID:   "system",
		PlayerName: "PetCoin",
		PetID:      petID,
		Text:       fmt.Sprintf("%s bergabung bersama %s!", name, petID),
		System:     true,
		Timestamp:  time.Now().UnixMilli(),
	}
	h.messages = append(h.messages, sysMsg)
	if len(h.messages) > 50 {
		h.messages = h.messages[len(h.messages)-50:]
	}

	playerList := make([]*Player, 0, len(h.players))
	for _, pl := range h.players {
		playerList = append(playerList, pl)
	}
	msgCopy := append([]ChatMessage(nil), h.messages...)
	ballCopy := h.ball
	h.mu.Unlock()

	h.sendDirect(c, OutgoingEnvelope{
		Type: "init",
		Payload: map[string]any{
			"selfId":   playerID,
			"players":  playerList,
			"messages": msgCopy,
			"ball":     ballCopy,
		},
	})

	h.broadcastJSON(OutgoingEnvelope{
		Type: "player_joined",
		Payload: map[string]any{
			"player":        player,
			"systemMessage": sysMsg,
		},
	}, c)
}

func (h *Hub) handleDisconnect(c *Client) {
	h.mu.Lock()
	delete(h.clients, c)
	if c.player == nil {
		h.mu.Unlock()
		return
	}
	leftPlayer := c.player
	delete(h.players, leftPlayer.ID)
	sysMsg := ChatMessage{
		ID:         h.nextID("msg"),
		PlayerID:   "system",
		PlayerName: "PetCoin",
		PetID:      leftPlayer.PetID,
		Text:       fmt.Sprintf("%s keluar dari playground.", leftPlayer.Name),
		System:     true,
		Timestamp:  time.Now().UnixMilli(),
	}
	h.messages = append(h.messages, sysMsg)
	if len(h.messages) > 50 {
		h.messages = h.messages[len(h.messages)-50:]
	}
	h.mu.Unlock()

	h.broadcastJSON(OutgoingEnvelope{
		Type: "player_left",
		Payload: map[string]any{
			"playerId":      leftPlayer.ID,
			"systemMessage": sysMsg,
		},
	}, nil)
}

func (h *Hub) handleMessage(c *Client, rawBytes []byte) {
	var env IncomingEnvelope
	if err := json.Unmarshal(rawBytes, &env); err != nil {
		return
	}

	if env.Type == "join" {
		h.handleJoin(c, env.Payload)
		return
	}

	h.mu.RLock()
	player := c.player
	h.mu.RUnlock()
	if player == nil {
		return
	}

	switch env.Type {
	case "move":
		var m MovePayload
		if err := json.Unmarshal(env.Payload, &m); err != nil {
			return
		}
		x := clampCoord(m.X, 7, 93)
		y := clampCoord(m.Y, 16, 88)
		h.mu.Lock()
		player.X = x
		player.Y = y
		h.mu.Unlock()

		h.broadcastJSON(OutgoingEnvelope{
			Type: "player_moved",
			Payload: map[string]any{
				"playerId": player.ID,
				"x":        x,
				"y":        y,
			},
		}, c)

	case "chat":
		var cp ChatPayload
		if err := json.Unmarshal(env.Payload, &cp); err != nil {
			return
		}
		text := strings.TrimSpace(cp.Text)
		if text == "" || utf8.RuneCountInString(text) > 160 {
			return
		}
		h.mu.Lock()
		msg := ChatMessage{
			ID:         h.nextID("msg"),
			PlayerID:   player.ID,
			PlayerName: player.Name,
			PetID:      player.PetID,
			Text:       text,
			System:     false,
			Timestamp:  time.Now().UnixMilli(),
		}
		h.messages = append(h.messages, msg)
		if len(h.messages) > 50 {
			h.messages = h.messages[len(h.messages)-50:]
		}
		h.mu.Unlock()

		h.broadcastJSON(OutgoingEnvelope{
			Type: "chat_message",
			Payload: map[string]any{
				"message": msg,
			},
		}, nil)

	case "emote":
		var ep EmotePayload
		if err := json.Unmarshal(env.Payload, &ep); err != nil {
			return
		}
		if !validEmotes[ep.Emote] {
			return
		}
		h.broadcastJSON(OutgoingEnvelope{
			Type: "player_emote",
			Payload: map[string]any{
				"playerId": player.ID,
				"emote":    ep.Emote,
			},
		}, nil)

	case "hop":
		h.broadcastJSON(OutgoingEnvelope{
			Type: "player_hop",
			Payload: map[string]any{
				"playerId": player.ID,
			},
		}, nil)

	case "ball_kick":
		var bp BallKickPayload
		if err := json.Unmarshal(env.Payload, &bp); err != nil {
			return
		}
		bx := clampCoord(bp.X, 10, 90)
		by := clampCoord(bp.Y, 18, 86)
		h.mu.Lock()
		h.ball = BallState{X: bx, Y: by}
		h.mu.Unlock()

		h.broadcastJSON(OutgoingEnvelope{
			Type: "ball_moved",
			Payload: map[string]any{
				"x":        bx,
				"y":        by,
				"kickerId": player.ID,
			},
		}, nil)
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (c *Client) readPump() {
	defer func() {
		c.hub.handleDisconnect(c)
		c.conn.Close()
		close(c.send)
	}()
	c.conn.SetReadLimit(4096)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		c.hub.handleMessage(c, message)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(25 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func serveWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("websocket upgrade error: %v", err)
		return
	}
	client := &Client{
		hub:  hub,
		conn: conn,
		send: make(chan []byte, 64),
	}
	hub.mu.Lock()
	hub.clients[client] = true
	hub.mu.Unlock()

	go client.writePump()
	go client.readPump()
}
