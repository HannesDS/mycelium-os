"""add_trace_fields_to_events

Revision ID: d8e3f92a2c4e
Revises: c8f2e91a1b3d
Create Date: 2026-03-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d8e3f92a2c4e"
down_revision: Union[str, Sequence[str], None] = "c8f2e91a1b3d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("events", sa.Column("token_count", sa.Integer(), nullable=True))
    op.add_column("events", sa.Column("cost_usd", sa.Numeric(), nullable=True))
    op.add_column("events", sa.Column("model", sa.Text(), nullable=True))
    op.add_column("events", sa.Column("trace_id", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "trace_id")
    op.drop_column("events", "model")
    op.drop_column("events", "cost_usd")
    op.drop_column("events", "token_count")
