# DLT API Platform

Professional API marketplace where developers buy/use download APIs (YouTube, Instagram, Facebook, TikTok, + more later).

## Tech stack
- Python + FastAPI (API-first, async, auto OpenAPI docs)
- yt-dlp (single download engine for all platforms)
- SQLAlchemy (async) + Alembic (migrations)
- PostgreSQL (prod) / SQLite (local dev)
- Redis (rate limiting / cache)
- Render deployment (`render.yaml` + Procfile)

## Structure
```
dl-platform/
├── app/
│   ├── main.py              # FastAPI app, routers
│   ├── config.py            # env + settings (pydantic)
│   ├── database.py          # SQLAlchemy engine/session
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # API key hash/verify, Bearer dependency
│   ├── quota.py             # quota/rate-limit helpers (Redis)
│   ├── billing.py           # plan/subscription/transaction logic
│   ├── proxies.py           # proxy health/rotation
│   ├── tasks.py             # background cleanup jobs
│   └── platforms/           # modular engine (one file per platform)
│       ├── base.py          # BaseEngine (yt-dlp wrapper)
│       ├── youtube.py
│       ├── instagram.py
│       ├── facebook.py
│       └── tiktok.py
├── web/                     # public website + dashboards
├── alembic/                 # DB migrations
├── tests/
├── .env.example
├── .env
├── requirements.txt
├── Dockerfile
├── render.yaml
├── Procfile
├── gunicorn.conf.py
└── README.md
```

## API (base path `/v1/dlt/`)
- `POST /{platform}/info` — media info + formats
- `POST /{platform}/download` — authorized download. Body: `url` plus
  `format` (`mp4` | `mp3` | `m4a` | height like `720p`), `quality`
  (`360p`…`2160p` | `best`) or `format_id` (exact yt-dlp id, wins over the rest).
- `GET /files/{token}` — temporary download URL (no auth, expires in
  `FILE_URL_TTL_SECONDS`, default 300s)
- `GET /account/quota` — remaining quota (`plan`, `limit`, `used`, `remaining`,
  `resets_at`)
- `GET /account/keys` — list API keys
- `POST /account/keys` — generate API key
- `DELETE /account/keys/{id}` — revoke API key

Auth: `Authorization: Bearer dl_live_...`

Public origin: `https://dltapi.cc.cd` (proxies `/v1/*` to the backend at
`https://dltbackend.cc.cd`).

## Local dev
```bash
cd dl-platform
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Deploy (Render)
Connect this repo to Render; it uses `render.yaml`. Set `DATABASE_URL` and `REDIS_URL` env vars.

Download requests are synchronous and can run for several minutes. Keep the
worker timeout above the download timeout:

- `DOWNLOAD_TIMEOUT_SECONDS` (default `600`) — max time for one download.
- `INFO_TIMEOUT_SECONDS` (default `120`) — max time for metadata extraction.
- `GUNICORN_TIMEOUT` (default `1200`) — must exceed `DOWNLOAD_TIMEOUT_SECONDS`.
- `MIN_FREE_DISK_MB` (default `256`) — requests fail fast with `507` when the disk is below this.
- `DOWNLOAD_ORPHAN_MAX_AGE_SECONDS` (default `1800`) — abandoned files older
  than this are removed by the background cleanup (runs every 5 minutes).

Make sure Render's Start Command runs `gunicorn -c gunicorn.conf.py app.main:app`
(or otherwise passes `--timeout`), because a plain `gunicorn app.main:app`
falls back to a 30s timeout and kills large downloads.
