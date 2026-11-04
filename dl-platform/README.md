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
- `POST /{platform}/download` — authorized download
- `GET /account/quota` — remaining quota
- `GET /account/keys` — list API keys
- `POST /account/keys` — generate API key
- `DELETE /account/keys/{id}` — revoke API key

Auth: `Authorization: Bearer dl_live_...`

## Local dev
```bash
cd dl-platform
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Deploy (Render)
Connect this repo to Render; it uses `render.yaml`. Set `DATABASE_URL` and `REDIS_URL` env vars.
