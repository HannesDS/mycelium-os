"""merge knowledge and constitution heads

Revision ID: f8c14695d374
Revises: f0a5b14c4e6g, f1a2b3c4d5e6
Create Date: 2026-03-18 13:52:18.656957

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8c14695d374'
down_revision: Union[str, Sequence[str], None] = ('f0a5b14c4e6g', 'f1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
