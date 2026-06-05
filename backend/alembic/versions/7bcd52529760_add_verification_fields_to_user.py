"""add_verification_fields_to_user

Revision ID: 7bcd52529760
Revises: a1b2c3d4e5f6
Create Date: 2026-06-01 17:49:17.482646

Idempotent: skips columns that already exist (e.g. on databases bootstrapped
via create_all before Alembic was enforced).
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '7bcd52529760'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = {c['name'] for c in inspector.get_columns('users')}

    if 'is_verified' not in existing_cols:
        # Backfill existing rows as verified so they can still log in.
        op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default=sa.true(), nullable=False))
        op.alter_column('users', 'is_verified', server_default=sa.false())

    if 'verification_token' not in existing_cols:
        op.add_column('users', sa.Column('verification_token', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'verification_token')
    op.drop_column('users', 'is_verified')
