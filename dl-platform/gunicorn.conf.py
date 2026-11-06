import os

bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
workers = int(os.getenv('GUNICORN_WORKERS', '2'))
threads = int(os.getenv('GUNICORN_THREADS', '2'))
worker_class = "uvicorn.workers.UvicornWorker"
# Downloads are synchronous and can take several minutes for large videos.
# The worker must outlive DOWNLOAD_TIMEOUT_SECONDS or it is killed mid-request.
timeout = int(os.getenv('GUNICORN_TIMEOUT', '1200'))
graceful_timeout = 30
keepalive = 5
preload_app = True
accesslog = "-"
errorlog = "-"
loglevel = "info"
max_requests = 1000
max_requests_jitter = 50
