# IPB Academic Help Center

Monorepo full-stack untuk portal bantuan akademik IPB: mahasiswa mengajukan tiket & memantau status, staff mengelola antrean, admin memantau layanan.

## Struktur

- `backend/` — FastAPI + SQLAlchemy + PostgreSQL + Alembic + JWT
- `frontend/` — React + Vite + JavaScript + Tailwind CSS

## Prasyarat

- Node.js 20+
- Python 3.11+
- Docker (untuk PostgreSQL lokal)

## Menjalankan secara lokal

### 1. Database PostgreSQL (Docker)

```bash
docker compose up -d
```

Default: `postgresql://postgres:postgres@localhost:5433/ipb_help`

### 2. Backend

```bash
cd backend
python -m venv .venv
# Linux/Mac:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env — pastikan DATABASE_URL benar dan JWT_SECRET diganti
```

Jalankan migrasi (wajib sebelum pertama kali start):

```bash
alembic upgrade head
```

Aktifkan demo seed untuk development (`ENABLE_DEMO_SEEDING=true` di `.env`), lalu jalankan:

```bash
uvicorn app.main:app --reload --port 8000
```

- Health check: `GET http://127.0.0.1:8000/health`
- Dokumentasi API: `http://127.0.0.1:8000/docs`
- WebSocket notifikasi: `ws://127.0.0.1:8000/api/v1/notifications/ws` (kirim token JWT sebagai pesan pertama setelah connect)
- Download file: `GET http://127.0.0.1:8000/api/v1/uploads/{filepath}` (perlu Auth header)

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Variabel lingkungan

### Backend (`backend/.env`)

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | URL SQLAlchemy PostgreSQL |
| `JWT_SECRET` | Secret JWT — **wajib diganti di produksi** |
| `JWT_ALGORITHM` | Default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Default `30` |
| `CORS_ORIGINS` | Origin yang diizinkan, pisahkan koma (mis. `https://app.vercel.app`) |
| `UPLOAD_DIR` | Path folder upload (gunakan path volume Railway di produksi) |
| `ENABLE_DEMO_SEEDING` | `true` = seed akun demo saat startup (development only) |
| `SMTP_*` | Konfigurasi email (opsional) |

### Frontend (`frontend/.env`)

| Variabel | Keterangan |
|---|---|
| `VITE_API_URL` | URL API backend termasuk `/api/v1` |

## Deploy

### Railway (backend)

1. Set environment variables di Railway dashboard: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` (URL Vercel frontend).
2. Pastikan `ENABLE_DEMO_SEEDING=false` di produksi.
3. `Procfile` sudah dikonfigurasi: `bash start.sh` (menjalankan `alembic upgrade head` lalu `uvicorn`).
4. Untuk storage persisten: pasang Railway Volume di path yang sama dengan `UPLOAD_DIR`.

#### Rollback database

```bash
# Downgrade satu step
alembic downgrade -1

# Downgrade ke revision tertentu
alembic downgrade <revision_id>

# Lihat history
alembic history
```

### Vercel (frontend)

- Build command: `npm run build`
- Output directory: `frontend/dist`
- Environment variable: `VITE_API_URL=https://your-backend.railway.app/api/v1`

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) menjalankan:
- Backend: install deps → jalankan migrasi ke DB test → docker build
- Frontend: install deps → build produksi

## Catatan keamanan produksi

- `JWT_SECRET` harus string random panjang: `python -c "import secrets; print(secrets.token_hex(32))"`
- `CORS_ORIGINS` harus berisi URL spesifik (bukan `*`)
- `ENABLE_DEMO_SEEDING` harus `false`
- File upload disajikan melalui endpoint terauthentikasi (`/api/v1/uploads/{filepath}`)
- Jangan commit `.env` ke git
