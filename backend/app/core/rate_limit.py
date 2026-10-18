import time
from collections import defaultdict
from threading import Lock
from typing import Optional

from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    """
    Thread-safe sliding-window rate limiter.
    Maintains timestamp records within a sliding window and purges expired entries.
    """
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history: dict[str, list[float]] = defaultdict(list)
        self.lock = Lock()

    def check(self, key: str, custom_message: Optional[str] = None) -> None:
        now = time.time()
        window_start = now - self.window_seconds

        with self.lock:
            # Filter out timestamps older than the sliding window
            timestamps = [t for t in self.history[key] if t > window_start]
            
            if len(timestamps) >= self.requests_limit:
                retry_after = int(timestamps[0] + self.window_seconds - now) + 1
                msg = custom_message or f"Too many requests. Please try again in {max(1, retry_after)} seconds."
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=msg,
                    headers={"Retry-After": str(max(1, retry_after))}
                )

            timestamps.append(now)
            self.history[key] = timestamps

    def cleanup(self) -> None:
        """Periodic cleanup of stale keys."""
        now = time.time()
        window_start = now - self.window_seconds
        with self.lock:
            keys_to_delete = [
                k for k, v in self.history.items() 
                if not any(t > window_start for t in v)
            ]
            for k in keys_to_delete:
                del self.history[k]


def get_client_ip(request: Request) -> str:
    """Extract client IP respecting standard reverse-proxy headers safely."""
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# Rate limiter for password reset endpoint: max 5 requests per 10 minutes per IP
forgot_password_limiter = InMemoryRateLimiter(requests_limit=5, window_seconds=600)

# Rate limiter for code execution endpoint: max 10 requests per minute per IP / user
code_execution_limiter = InMemoryRateLimiter(requests_limit=10, window_seconds=60)
