FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir "httpx[socks]>=0.27" "socksio>=1.0.0" \
    && python -c "import socksio, httpx; print('SOCKS proxy support OK (socksio present)')"

COPY . .

EXPOSE 8000

CMD gunicorn -c gunicorn.conf.py app.main:app
