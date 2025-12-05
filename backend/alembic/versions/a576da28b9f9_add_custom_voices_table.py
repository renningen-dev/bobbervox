"""add_custom_voices_table

Revision ID: a576da28b9f9
Revises: ff5ac6cad25d
Create Date: 2025-12-05 10:49:45.427019

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a576da28b9f9"
down_revision: Union[str, Sequence[str], None] = "ff5ac6cad25d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "custom_voices",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_custom_voices_user_id", "custom_voices", ["user_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_custom_voices_user_id", table_name="custom_voices")
    op.drop_table("custom_voices")
