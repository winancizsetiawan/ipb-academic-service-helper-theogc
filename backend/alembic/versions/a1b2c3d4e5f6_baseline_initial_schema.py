"""baseline_initial_schema

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-06-05 00:00:00.000000

Creates all base tables for a fresh database. Safe to run on existing databases
that were bootstrapped via create_all — conditional checks skip tables that
already exist so the subsequent column-addition migrations can proceed normally.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # Create PostgreSQL enum types idempotently
    op.execute(
        "DO $$ BEGIN CREATE TYPE userrole AS ENUM ('mahasiswa', 'staff', 'admin');"
        " EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    )
    op.execute(
        "DO $$ BEGIN CREATE TYPE faqstatus AS ENUM ('draft', 'published', 'archived');"
        " EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    )
    op.execute(
        "DO $$ BEGIN CREATE TYPE ticketstatus AS ENUM ('open', 'progress', 'resolved');"
        " EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    )
    op.execute(
        "DO $$ BEGIN CREATE TYPE ticketpriority AS ENUM ('low', 'medium', 'high');"
        " EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    )

    if "users" not in existing_tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("nama", sa.String(), nullable=False),
            sa.Column("nim_or_nip", sa.String(), nullable=True),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("hashed_password", sa.String(), nullable=False),
            sa.Column(
                "role",
                sa.Enum("mahasiswa", "staff", "admin", name="userrole", create_type=False),
                nullable=False,
            ),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_users_id", "users", ["id"], unique=False)
        op.create_index("ix_users_email", "users", ["email"], unique=True)

    if "categories" not in existing_tables:
        op.create_table(
            "categories",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("nama_kategori", sa.String(), nullable=False),
            sa.Column("deskripsi", sa.Text(), nullable=True),
            sa.Column("icon", sa.String(), nullable=False, server_default="📄"),
            sa.Column("bg_color", sa.String(), nullable=False, server_default="#F1EFE8"),
            sa.Column("type", sa.String(), nullable=False, server_default="manual"),
            sa.Column("template", sa.Text(), nullable=True),
            sa.Column("ttd", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("nama_kategori"),
        )
        op.create_index("ix_categories_id", "categories", ["id"], unique=False)

    if "tickets" not in existing_tables:
        op.create_table(
            "tickets",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column(
                "status",
                sa.Enum("open", "progress", "resolved", name="ticketstatus", create_type=False),
                nullable=False,
            ),
            sa.Column(
                "priority",
                sa.Enum("low", "medium", "high", name="ticketpriority", create_type=False),
                nullable=False,
            ),
            sa.Column("category_id", sa.Integer(), nullable=True),
            sa.Column("student_id", sa.Integer(), nullable=False),
            sa.Column("staff_id", sa.Integer(), nullable=True),
            sa.Column("deadline", sa.Date(), nullable=True),
            sa.Column("form_data", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
            sa.ForeignKeyConstraint(["staff_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_tickets_id", "tickets", ["id"], unique=False)
        op.create_index("ix_tickets_student_id", "tickets", ["student_id"], unique=False)
        op.create_index("ix_tickets_status", "tickets", ["status"], unique=False)

    if "ticket_notes" not in existing_tables:
        op.create_table(
            "ticket_notes",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("ticket_id", sa.Integer(), nullable=False),
            sa.Column("author_id", sa.Integer(), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_ticket_notes_id", "ticket_notes", ["id"], unique=False)

    if "attachments" not in existing_tables:
        op.create_table(
            "attachments",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("ticket_id", sa.Integer(), nullable=True),
            sa.Column("filename", sa.String(), nullable=False),
            sa.Column("filepath", sa.String(), nullable=False),
            sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_attachments_id", "attachments", ["id"], unique=False)

    if "faqs" not in existing_tables:
        op.create_table(
            "faqs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("question", sa.String(), nullable=False),
            sa.Column("answer", sa.Text(), nullable=False),
            sa.Column(
                "status",
                sa.Enum("draft", "published", "archived", name="faqstatus", create_type=False),
                nullable=False,
            ),
            sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("category_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_faqs_id", "faqs", ["id"], unique=False)

    if "discussions" not in existing_tables:
        op.create_table(
            "discussions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("faq_id", sa.Integer(), nullable=False),
            sa.Column("author_id", sa.Integer(), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["faq_id"], ["faqs.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_discussions_id", "discussions", ["id"], unique=False)

    if "discussion_replies" not in existing_tables:
        op.create_table(
            "discussion_replies",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("discussion_id", sa.Integer(), nullable=False),
            sa.Column("author_id", sa.Integer(), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["discussion_id"], ["discussions.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_discussion_replies_id", "discussion_replies", ["id"], unique=False)

    if "notifications" not in existing_tables:
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_notifications_id", "notifications", ["id"], unique=False)


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("discussion_replies")
    op.drop_table("discussions")
    op.drop_table("faqs")
    op.drop_table("attachments")
    op.drop_table("ticket_notes")
    op.drop_table("tickets")
    op.drop_table("categories")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS ticketpriority")
    op.execute("DROP TYPE IF EXISTS ticketstatus")
    op.execute("DROP TYPE IF EXISTS faqstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
