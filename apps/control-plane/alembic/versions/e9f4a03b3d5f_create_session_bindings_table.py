"""create_session_bindings_table

Revision ID: e9f4a03b3d5f
Revises: d8e3f92a2c4e
Create Date: 2026-03-11 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e9f4a03b3d5f"
down_revision: Union[str, Sequence[str], None] = "d8e3f92a2c4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "session_bindings",
        sa.Column("principal_id", sa.Text(), nullable=False),
        sa.Column("shroom_id", sa.Text(), nullable=False),
        sa.Column("session_id", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("principal_id", "shroom_id"),
    )


def downgrade() -> None:
    op.drop_table("session_bindings")
