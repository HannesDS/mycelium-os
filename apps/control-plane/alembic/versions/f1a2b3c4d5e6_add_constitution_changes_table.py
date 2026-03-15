"""add_constitution_changes_table

Revision ID: f1a2b3c4d5e6
Revises: e9f4a03b3d5f
Create Date: 2026-03-15 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e9f4a03b3d5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "constitution_changes",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("approval_id", sa.Uuid(), sa.ForeignKey("approvals.id"), nullable=True),
        sa.Column("change_type", sa.Text(), nullable=False),
        sa.Column("change_summary", sa.Text(), nullable=False),
        sa.Column("payload", JSONB(), nullable=False),
        sa.Column("constitution_snapshot", JSONB(), nullable=False),
        sa.Column("applied_by", sa.Text(), nullable=False),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(
        "ix_constitution_changes_applied_at",
        "constitution_changes",
        [sa.text("applied_at DESC")],
    )


def downgrade() -> None:
    op.drop_index("ix_constitution_changes_applied_at", table_name="constitution_changes")
    op.drop_table("constitution_changes")
