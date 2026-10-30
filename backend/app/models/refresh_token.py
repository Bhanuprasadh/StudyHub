from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class RefreshToken(Base):
    """
    Stores hashed refresh tokens with family-based rotation detection.
    A token 'family' groups all rotated descendants of a single login event.
    If a revoked token in a family is reused, the entire family is revoked
    to protect against token theft.
    """
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(512), unique=True, nullable=False)   # SHA-256 hex of raw token
    family_id = Column(String(64), nullable=False, index=True)      # UUID per login session
    revoked = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)     # Timestamp when token was rotated/revoked
    replaced_by = Column(String(512), nullable=True)                # token_hash of successor

    user = relationship("User", back_populates="refresh_tokens")

    __table_args__ = (
        # Composite index for fast lookup during token validation
        Index("ix_refresh_tokens_user_family", "user_id", "family_id"),
    )
