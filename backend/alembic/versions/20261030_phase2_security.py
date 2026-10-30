"""phase2_security_and_indexes

Adds:
- refresh_tokens table (refresh token rotation system)
- users.failed_login_attempts column (account lockout)
- users.locked_until column (account lockout)
- Composite index ix_enrollments_course_user
- Composite index ix_quiz_attempts_quiz_user

Revision ID: 20261030_phase2_security
Revises: 8cb542ccd8e5
Create Date: 2026-10-30
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20261030_phase2_security"
down_revision = "8cb542ccd8e5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── refresh_tokens table ────────────────────────────────────────────────
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(512), nullable=False, unique=True),
        sa.Column("family_id", sa.String(64), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("replaced_by", sa.String(512), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_refresh_tokens_id", "refresh_tokens", ["id"])
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_family_id", "refresh_tokens", ["family_id"])
    op.create_index("ix_refresh_tokens_revoked", "refresh_tokens", ["revoked"])
    op.create_index("ix_refresh_tokens_user_family", "refresh_tokens", ["user_id", "family_id"])

    # ── Account lockout columns on users ────────────────────────────────────
    op.add_column("users", sa.Column("failed_login_attempts", sa.Integer(),
                                      nullable=False, server_default=sa.text("0")))
    op.add_column("users", sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True))

    # ── Composite performance indexes ───────────────────────────────────────
    op.create_index("ix_enrollments_course_user", "enrollments", ["course_id", "user_id"])
    op.create_index("ix_quiz_attempts_quiz_user", "quiz_attempts", ["quiz_id", "user_id"])


def downgrade() -> None:
    op.drop_index("ix_quiz_attempts_quiz_user", table_name="quiz_attempts")
    op.drop_index("ix_enrollments_course_user", table_name="enrollments")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_login_attempts")
    op.drop_index("ix_refresh_tokens_user_family", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_revoked", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_family_id", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
