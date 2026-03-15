"""create_shroom_beads_table

Revision ID: a3fd52c02a40
Revises:
Create Date: 2026-03-07 14:54:47.828771

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a3fd52c02a40"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shroom_beads",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("(UUID())")),
        sa.Column("shroom_id", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("prev_bead_id", sa.Uuid(), sa.ForeignKey("shroom_beads.id"), nullable=True),
    )
    op.create_index(
        "ix_shroom_beads_shroom_created",
        "shroom_beads",
        ["shroom_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_shroom_beads_shroom_created", table_name="shroom_beads")
    op.drop_table("shroom_beads")
