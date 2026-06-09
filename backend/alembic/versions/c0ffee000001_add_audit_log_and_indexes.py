"""add_audit_log_and_indexes

Revision ID: c0ffee000001
Revises: 70f4f84e4cb8
Create Date: 2026-06-05 00:00:00.000000

- Adds audit_logs table for compliance / sensitive-action tracking.
- Adds performance indexes on tickets (student_id, status, staff_id) and
  notifications (user_id) that are not guaranteed by the baseline migration.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c0ffee000001"
down_revision: Union[str, Sequence[str], None] = "70f4f84e4cb8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_context().connection
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # ------------------------------------------------------------------
    # audit_logs table
    # ------------------------------------------------------------------
    if "audit_logs" not in existing_tables:
        op.create_table(
            "audit_logs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("actor_id", sa.Integer(), nullable=True),
            sa.Column("action", sa.String(length=100), nullable=False),
            sa.Column("resource_type", sa.String(length=50), nullable=True),
            sa.Column("resource_id", sa.Integer(), nullable=True),
            sa.Column("detail", sa.Text(), nullable=True),
            sa.Column("ip_address", sa.String(length=45), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_audit_logs_id", "audit_logs", ["id"], unique=False)
        op.create_index("ix_audit_logs_action", "audit_logs", ["action"], unique=False)
        op.create_index("ix_audit_logs_resource_type", "audit_logs", ["resource_type"], unique=False)
        op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"], unique=False)

    # ------------------------------------------------------------------
    # Performance indexes — idempotent
    # ------------------------------------------------------------------
    def _ensure_index(table: str, index: str, columns: list) -> None:
        existing = {ix["name"] for ix in inspector.get_indexes(table)}
        if index not in existing:
            op.create_index(index, table, columns, unique=False)

    _ensure_index("tickets", "ix_tickets_student_id", ["student_id"])
    _ensure_index("tickets", "ix_tickets_status", ["status"])
    _ensure_index("tickets", "ix_tickets_staff_id", ["staff_id"])
    _ensure_index("notifications", "ix_notifications_user_id", ["user_id"])
    _ensure_index("notifications", "ix_notifications_is_read", ["is_read"])


def downgrade() -> None:
    op.drop_index("ix_notifications_is_read", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_index("ix_tickets_staff_id", table_name="tickets")
    op.drop_index("ix_tickets_status", table_name="tickets")
    op.drop_index("ix_tickets_student_id", table_name="tickets")
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_resource_type", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_id", table_name="audit_logs")
    op.drop_table("audit_logs")
