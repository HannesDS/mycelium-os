"""create_events_table

Revision ID: c8f2e91a1b3d
Revises: b7e1a3d04f12
Create Date: 2026-03-11 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "c8f2e91a1b3d"
down_revision: Union[str, Sequence[str], None] = "b7e1a3d04f12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("shroom_id", sa.Text(), nullable=False),
        sa.Column("event", sa.Text(), nullable=False),
        sa.Column("to", sa.Text(), nullable=True),
        sa.Column("topic", sa.Text(), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payload_summary", sa.Text(), nullable=False),
        sa.Column("metadata", JSONB(), nullable=True),
        sa.Column("session_id", sa.Text(), nullable=True),
    )
    op.create_index(
        "ix_events_timestamp_shroom_id",
        "events",
        ["timestamp", "shroom_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_events_timestamp_shroom_id", table_name="events")
    op.drop_table("events")
