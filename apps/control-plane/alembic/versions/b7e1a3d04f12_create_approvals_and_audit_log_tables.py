"""create_approvals_and_audit_log_tables

Revision ID: b7e1a3d04f12
Revises: a3fd52c02a40
Create Date: 2026-03-08 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b7e1a3d04f12"
down_revision: Union[str, Sequence[str], None] = "a3fd52c02a40"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "approvals",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("(UUID())")),
        sa.Column("shroom_id", sa.Text(), nullable=False),
        sa.Column("event_type", sa.Text(), nullable=False, server_default="escalation_raised"),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("status", sa.Text(), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_by", sa.Text(), nullable=True),
    )
    op.create_index(
        "ix_approvals_status",
        "approvals",
        ["status"],
    )

    op.create_table(
        "audit_log",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("(UUID())")),
        sa.Column("entity_type", sa.Text(), nullable=False),
        sa.Column("entity_id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("actor", sa.Text(), nullable=False, server_default="human"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("details", sa.JSON(), nullable=True),
    )
    op.create_index(
        "ix_audit_log_entity",
        "audit_log",
        ["entity_type", "entity_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_audit_log_entity", table_name="audit_log")
    op.drop_table("audit_log")
    op.drop_index("ix_approvals_status", table_name="approvals")
    op.drop_table("approvals")
