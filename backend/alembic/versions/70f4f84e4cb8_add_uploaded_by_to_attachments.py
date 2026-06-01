"""add_uploaded_by_to_attachments

Revision ID: 70f4f84e4cb8
Revises: 2d6a55e6f3a1
Create Date: 2026-06-01 19:10:00.000000

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
    """Upgrade schema."""
    op.add_column("attachments", sa.Column("uploaded_by_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_attachments_uploaded_by_id_users",
        "attachments",
        "users",
        ["uploaded_by_id"],
        ["id"],
    )
    op.create_index("ix_attachments_uploaded_by_id", "attachments", ["uploaded_by_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_attachments_uploaded_by_id", table_name="attachments")
    op.drop_constraint("fk_attachments_uploaded_by_id_users", "attachments", type_="foreignkey")
    op.drop_column("attachments", "uploaded_by_id")
