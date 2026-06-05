"""add_password_reset_fields_to_user

Revision ID: 2d6a55e6f3a1
Revises: 7bcd52529760
Create Date: 2026-06-01 18:20:00.000000

Idempotent: skips columns/indexes that already exist.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "2d6a55e6f3a1"
down_revision: Union[str, Sequence[str], None] = "7bcd52529760"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = {c['name'] for c in inspector.get_columns('users')}
    existing_indexes = {ix['name'] for ix in inspector.get_indexes('users')}

    if 'reset_token' not in existing_cols:
        op.add_column("users", sa.Column("reset_token", sa.String(), nullable=True))

    if 'reset_token_expiry' not in existing_cols:
        op.add_column("users", sa.Column("reset_token_expiry", sa.DateTime(timezone=True), nullable=True))

    if 'ix_users_reset_token' not in existing_indexes:
        op.create_index("ix_users_reset_token", "users", ["reset_token"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_reset_token", table_name="users")
    op.drop_column("users", "reset_token_expiry")
    op.drop_column("users", "reset_token")
