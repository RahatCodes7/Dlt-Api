"""Filesystem-backed download tokens.

The API runs under gunicorn with multiple worker processes. A token kept in
``app.state`` only exists inside the worker that created it, so a file request
that lands on a different worker returned 404. Persisting a tiny JSON record on
disk (shared by all workers on the host) makes file delivery reliable without
adding Redis or another database round-trip.
"""

import json
import os
import re
import shutil
import time
import uuid
from pathlib import Path
from typing import Optional, Tuple

from app.platforms.base import DOWNLOAD_DIR

TOKEN_DIR = DOWNLOAD_DIR / ".tokens"
TOKEN_DIR.mkdir(parents=True, exist_ok=True)

TOKEN_RE = re.compile(r"^[a-f0-9]{32}$")


def _write_atomic(path: Path, payload: dict) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    os.replace(tmp, path)


def create_file_token(file_path: str, ttl_seconds: int) -> str:
    token = uuid.uuid4().hex
    _write_atomic(
        TOKEN_DIR / f"{token}.json",
        {
            "path": os.path.abspath(file_path),
            "expires_at": time.time() + max(1, ttl_seconds),
        },
    )
    return token


def resolve_file_token(token: str) -> Optional[Tuple[str, float]]:
    """Return ``(file_path, expires_at)`` for a valid, unexpired token."""
    if not TOKEN_RE.fullmatch(token or ""):
        return None

    record_path = TOKEN_DIR / f"{token}.json"
    try:
        record = json.loads(record_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None

    file_path = str(record.get("path") or "")
    expires_at = float(record.get("expires_at") or 0)
    if not file_path or time.time() > expires_at:
        consume_file_token(token)
        return None

    # Defence in depth: never serve a path outside the downloads directory.
    root = DOWNLOAD_DIR.resolve()
    try:
        Path(file_path).resolve().relative_to(root)
    except ValueError:
        consume_file_token(token)
        return None

    return file_path, expires_at


def consume_file_token(token: str) -> None:
    if not TOKEN_RE.fullmatch(token or ""):
        return
    try:
        (TOKEN_DIR / f"{token}.json").unlink(missing_ok=True)
    except OSError:
        pass


def cleanup_expired_tokens() -> int:
    """Remove expired token records (and their files). Returns count removed."""
    removed = 0
    now = time.time()
    for record in TOKEN_DIR.glob("*.json"):
        try:
            data = json.loads(record.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            record.unlink(missing_ok=True)
            continue
        if float(data.get("expires_at") or 0) > now:
            continue
        file_path = data.get("path")
        if file_path:
            try:
                os.remove(file_path)
            except OSError:
                pass
        record.unlink(missing_ok=True)
        removed += 1
    return removed


def _active_paths() -> set[str]:
    paths: set[str] = set()
    for record in TOKEN_DIR.glob("*.json"):
        try:
            data = json.loads(record.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        file_path = data.get("path")
        if file_path:
            paths.add(os.path.abspath(str(file_path)))
    return paths


def cleanup_orphan_files(max_age_seconds: int = 3600) -> int:
    """Remove download files that no live token references and are old.

    A worker killed mid-download (or a client that never fetches its file) can
    leave large files behind. On small ephemeral disks that eventually makes
    every new download fail, so sweep them up on a short interval.
    """
    removed = 0
    cutoff = time.time() - max(60, max_age_seconds)
    active = _active_paths()
    for entry in DOWNLOAD_DIR.iterdir():
        try:
            if entry.is_dir():
                if entry.name == ".tokens" or entry.stat().st_mtime > cutoff:
                    continue
                # Temporary workspace left behind by a killed worker.
                shutil.rmtree(entry, ignore_errors=True)
                removed += 1
                continue
            if entry.name.startswith("."):
                continue
            if entry.stat().st_mtime > cutoff:
                continue
            if str(entry.resolve()) in active:
                continue
            entry.unlink()
            removed += 1
        except OSError:
            continue
    return removed
