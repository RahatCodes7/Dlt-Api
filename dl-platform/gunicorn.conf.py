from gunicorn.conf import *  # noqa

bind = f"0.0.0.0:{__import__('os').getenv('PORT', '8000')}"
workers = int(__import__('os').getenv('GUNICORN_WORKERS', '2'))
threads = int(__import__('os').getenv('GUNICORN_THREADS', '2'))
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
graceful_timeout = 30
keepalive = 5
preload_app = True
accesslog = "-"
errorlog = "-"
loglevel = "info"
max_requests = 1000
max_requests_jitter = 50
