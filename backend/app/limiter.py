"""
Rate Limiter Singleton — Supports distributed Redis and local in-memory fallback.

In TESTING mode (TESTING=True), rate limiting is disabled to allow automated
test suites to make multiple requests without hitting rate limits from the
shared 'testclient' IP address.
"""
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.config import settings

logger = logging.getLogger("studyhub.limiter")

# ── Testing mode: disable rate limiting entirely ──────────────────────────────
if settings.TESTING:
    logger.info("TESTING=True: Rate limiting DISABLED for test environment.")
    limiter = Limiter(
        key_func=get_remote_address,
        enabled=False,
        storage_uri="memory://",
    )
else:
    # ── Production/development mode: Redis with memory fallback ───────────────
    storage_uri = "memory://"
    if settings.RATE_LIMIT_STORAGE == "redis" or (
        settings.RATE_LIMIT_STORAGE == "auto" and settings.is_production
    ):
        try:
            import redis
            _redis_client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=1)
            _redis_client.ping()
            storage_uri = settings.REDIS_URL
            logger.info(
                f"Connected to distributed Redis rate-limit store at {settings.REDIS_URL}"
            )
        except Exception as e:
            logger.warning(
                f"Redis rate limit connection not available ({e}); using memory store."
            )
            storage_uri = "memory://"

    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[settings.RATE_LIMIT_API],
        storage_uri=storage_uri,
    )
