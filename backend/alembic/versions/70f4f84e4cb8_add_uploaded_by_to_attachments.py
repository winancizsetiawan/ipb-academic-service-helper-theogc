"""add_uploaded_by_to_attachments

Revision ID: 70f4f84e4cb8
Revises: 2d6a55e6f3a1
Create Date: 2026-06-01 19:10:00.000000

Idempotent: skips column/FK/index if they already exist.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "70f4f84e4cb8"
down_revision: Union[str, Sequence[str], None] = "2d6a55e6f3a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — idempotent."""
    conn = op.get_context().connection
    inspector = sa.inspect(conn)
    existing_cols = {c["name"] for c in inspector.get_columns("attachments")}

    if "uploaded_by_id" not in existing_cols:
        op.add_column("attachments", sa.Column("uploaded_by_id", sa.Integer(), nullable=True))

    existing_fks = {fk["name"] for fk in inspector.get_foreign_keys("attachments")}
    if "fk_attachments_uploaded_by_id_users" not in existing_fks:
        op.create_foreign_key(
            "fk_attachments_uploaded_by_id_users",
            "attachments",
            "users",
            ["uploaded_by_id"],
            ["id"],
        )

    existing_indexes = {ix["name"] for ix in inspector.get_indexes("attachments")}
    if "ix_attachments_uploaded_by_id" not in existing_indexes:
        op.create_index("ix_attachments_uploaded_by_id", "attachments", ["uploaded_by_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_attachments_uploaded_by_id", table_name="attachments")
    op.drop_constraint("fk_attachments_uploaded_by_id_users", "attachments", type_="foreignkey")
    op.drop_column("attachments", "uploaded_by_id")
