# PetCoin — Virtual Pet, Arcade & Multiplayer Playground

PetCoin adalah game web merawat hewan virtual dengan ekonomi ganda, 3 mini-game penghasil Coin, sistem progres & retensi, serta **Multiplayer Playground** real-time berbasis **WebSocket Golang**.

---

## Fitur Utama

### 1. Ekonomi Ganda (2 Mata Uang)
- **Treat (`🍪`)** — Diperoleh dari **merawat hewan** (elus combo, memberi makan di Kitchen, bermain di Closet & Play, mandi 3 langkah di Bathroom, dan tidur di Bedroom). Digunakan untuk **mengadopsi hewan baru**.
- **Coin (`🪙`)** — Diperoleh dari **bermain Mini Game**. Digunakan untuk **membeli aksesori** (gaya rambut, topi, syal, kalung, dan mainan) di Butik Aksesori.

### 2. Perawatan Hewan & Status Terpadu
- **5 Hewan Koleksi**: Mochi (Cat · Gratis), Gajah (Elephant · 15 Treat), Barnaby (Bear · 35 Treat), Boba (Rabbit · 70 Treat), Chiki (Chicken · 120 Treat).
- **4 Status Hewan**: *Senang*, *Kenyang*, *Bersih*, dan *Energi* lengkap dengan label kondisi dan level/XP per hewan.
- **4 Ruangan Interaktif**: Kitchen, Closet & Play, Bathroom (`Sabun → Shower → Handuk`), dan Bedroom (`Lampu & Penutup Mata`).

### 3. Mini Game Arcade & Retensi
- **3 Mini Game**: Tangkap Koin, Cocokkan Kartu, dan Lempar Tangkap.
- **Sistem Retensi**: Bonus Check-In Harian (Streak 7 Hari), 3 Misi Harian, 8 Lencana Kolektor, serta efek audio Web Audio API dan animasi/partikel interaktif.

### 4. Multiplayer Playground (WebSocket Golang)
- **Gerbang Nama**: Pemain wajib memasukkan nama panggilan (`2–20` karakter) dan memilih pet aktif (beserta kosmetik yang dipakai) sebelum masuk taman.
- **Interaksi Real-Time**:
  - Klik taman atau tekan `WASD` / tombol panah untuk menggerakkan pet secara sinkron ke semua pemain.
  - Tekan `Spasi` atau tombol **Lompat!** untuk animasi lompatan bersama.
  - Tendang **Bola Playground (`⚽`)** bersama-sama (posisi bola disinkronkan oleh server).
  - Kirim **Emote Cepat** (`👋`, `♥`, `🎉`, `🍪`, `🪙`, `😂`) dan **Chat Real-Time** lengkap dengan balon percakapan di atas kepala pet.

---

## Arsitektur Deploy (Caddy + Docker Compose)

```text
Browser (HTTPS / WSS)
        │
        ▼
  Caddy (:80 / :443)  ──►  /ws* & /healthz  ──►  backend-ws:8080 (Golang gorilla/websocket)
        │
        └───────────────►  /*               ──►  frontend:80     (React + Vite static via Nginx)
```

### Struktur File Penting
```text
.
├── backend/                # Server WebSocket Golang (gorilla/websocket)
│   ├── main.go             # HTTP server (:8080) endpoint /ws dan /healthz
│   ├── hub.go              # Authoritative hub (players, chat, ball, broadcast)
│   ├── go.mod              # Dependensi Go (github.com/gorilla/websocket)
│   └── Dockerfile          # Multi-stage build binary Go
├── src/                    # Frontend React + TypeScript + Tailwind CSS
├── server.ts               # Server dev/preview Express + Vite + ws (port 3000)
├── Dockerfile              # Multi-stage build frontend SPA + Nginx
├── Caddyfile               # Reverse proxy Caddy (auto HTTPS + WebSocket support)
└── docker-compose.yml      # Orkestrasi frontend, backend-ws (Go), dan caddy
```

---

## Panduan Deploy

### Opsi A — Deploy Lokal dengan Docker Compose (`http://localhost`)

Pastikan **Docker** dan **Docker Compose** sudah terpasang, lalu jalankan dari root proyek:

```bash
docker compose up --build -d
```

Setelah container sehat:
- Buka aplikasi di browser: `http://localhost`
- Cek health server Golang: `http://localhost/healthz` (mengembalikan `{"online":0,"status":"ok"}`)
- Playground WebSocket otomatis terhubung ke `ws://localhost/ws`

Melihat log container:
```bash
docker compose logs -f caddy backend-ws
```

Menghentikan layanan:
```bash
docker compose down
```

---

### Opsi B — Deploy ke VPS Production + Domain + HTTPS Otomatis (Caddy)

Caddy otomatis mengurus sertifikat SSL/TLS **Let's Encrypt** dan mengarahkan koneksi WebSocket menjadi aman (`wss://`) tanpa konfigurasi manual NGINX/Certbot.

#### 1. Persiapan Server & DNS
1. Siapkan VPS Linux (Ubuntu 22.04/24.04 atau Debian) dengan Docker & Docker Compose terpasang.
2. Arahkan **DNS A Record** domain kamu (misal `petcoin.domainkamu.com`) ke IP publik VPS.
3. Buka port HTTP/HTTPS di firewall server:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 443/udp
   ```
   *(Pastikan tidak ada Apache/Nginx lain di host yang memakai port `80` atau `443`.)*

#### 2. Atur Domain di `.env`
Buat file `.env` di root proyek (sejajar dengan `docker-compose.yml`):

```env
SITE_ADDRESS=petcoin.domainkamu.com
```

> **Catatan**: Jika belum punya domain dan ingin pakai IP VPS langsung (HTTP saja), biarkan `SITE_ADDRESS=:80` atau jangan buat variabel `SITE_ADDRESS`.

#### 3. Build & Jalankan
```bash
docker compose up --build -d
```

Caddy akan otomatis meminta sertifikat TLS ke Let's Encrypt untuk `petcoin.domainkamu.com`, mengalihkan HTTP ke HTTPS, dan browser otomatis tersambung ke `wss://petcoin.domainkamu.com/ws`.

#### 4. Update / Redeploy Setelah Perubahan Kode
```bash
git pull
docker compose up --build -d
```
Volume `caddy_data` dan `caddy_config` tetap tersimpan sehingga sertifikat TLS tidak perlu diterbitkan ulang.

---

## Penjelasan Konfigurasi `Caddyfile`

Isi `Caddyfile`:

```caddyfile
{$SITE_ADDRESS::80} {
  encode zstd gzip

  header {
    X-Content-Type-Options "nosniff"
    X-Frame-Options "SAMEORIGIN"
    Referrer-Policy "strict-origin-when-cross-origin"
    -Server
  }

  handle /ws* {
    reverse_proxy backend-ws:8080 {
      flush_interval -1
    }
  }

  handle /healthz {
    reverse_proxy backend-ws:8080
  }

  handle {
    reverse_proxy frontend:80
  }
}
```

Poin penting:
1. **`{$SITE_ADDRESS::80}`**: Membaca env `SITE_ADDRESS`. Jika kosong, otomatis memakai `:80` (aman untuk lokal/IP tanpa SSL). Jika diisi nama domain, Caddy otomatis mengaktifkan HTTPS + HTTP/2 + HTTP/3.
2. **`handle /ws*` + `flush_interval -1`**: Caddy v2 secara bawaan mendukung *WebSocket Upgrade* (`Upgrade: websocket`, `Connection: Upgrade`). `flush_interval -1` memastikan frame WebSocket langsung diteruskan (*streaming*) tanpa di-buffer.
3. **Satu Origin (No CORS Hassle)**: Karena frontend dan `/ws` dilayani lewat domain/port yang sama melalui Caddy, browser tidak mengalami masalah CORS maupun *mixed content* (`https://` wajib memakai `wss://`).
4. **Jika Memakai Cloudflare Proxy (Orange Cloud)**: Set mode SSL/TLS di dashboard Cloudflare ke **Full (strict)** dan aktifkan toggle **WebSockets** di menu *Network*.

---

## Menjalankan Secara Terpisah (Development Lokal Tanpa Docker)

### 1. Server WebSocket Golang
```bash
cd backend
go mod tidy
go run .
# Berjalan di http://localhost:8080 (/ws dan /healthz)
```

### 2. Frontend Dev Server (Node.js)
```bash
npm install
# Opsi A: Pakai built-in server.ts (sudah termasuk WebSocket /ws di port 3000)
npm run dev

# Opsi B: Sambungkan frontend ke server Go di port 8080
VITE_WS_URL=ws://localhost:8080/ws npm run dev
```

---

## Troubleshooting Deploy

- **WebSocket gagal konek / status terus "Menghubungkan ulang..."**:
  - Cek log backend Go: `docker compose logs backend-ws`
  - Cek log Caddy: `docker compose logs caddy`
  - Pastikan `/healthz` mengembalikan `200 OK` (`curl -i https://domainkamu.com/healthz`).
- **Port 80/443 sudah terpakai (`bind: address already in use`)**:
  - Hentikan Nginx/Apache bawaan host (`sudo systemctl stop nginx`) sebelum menjalankan `docker compose up -d`.
- **Sertifikat HTTPS gagal terbit di VPS**:
  - Pastikan DNS A Record domain sudah mengarah ke IP VPS dan port `80` + `443` tidak diblokir firewall cloud provider (AWS Security Group, GCP Firewall, DigitalOcean Cloud Firewall, dll.).

---

## Protokol WebSocket Playground

- **Client → Server**:
  - `join`: `{ name, petId, level, equipped }`
  - `move`: `{ x, y }`
  - `chat`: `{ text }`
  - `emote`: `{ emote }`
  - `hop`: `{}`
  - `ball_kick`: `{ x, y }`
- **Server → Client**:
  - `init`: `{ selfId, players, messages, ball }`
  - `player_joined` / `player_left`
  - `player_moved` / `player_emote` / `player_hop`
  - `chat_message` / `ball_moved` / `error`
