"""Add user profile and submission metadata columns

Revision ID: 8cc91a23b45e
Revises: 7bb92e64889c
Create Date: 2026-10-18 17:35:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '8cc91a23b45e'
down_revision: Union[str, Sequence[str], None] = '7bb92e64889c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table additions
    op.add_column('users', sa.Column('college_logo', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('roll_number', sa.String(), nullable=True))
    op.add_column('users', sa.Column('reset_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('reset_token_expires', sa.DateTime(), nullable=True))

    # Submissions table additions
    op.add_column('submissions', sa.Column('user_id', sa.UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True))
    op.add_column('submissions', sa.Column('filename', sa.String(), nullable=True))
    op.add_column('submissions', sa.Column('date_of_lab', sa.String(), nullable=True))
    op.add_column('submissions', sa.Column('subject_of_lab', sa.String(), nullable=True))
    op.add_column('submissions', sa.Column('subject_code', sa.String(), nullable=True))
    op.add_column('submissions', sa.Column('group_name', sa.String(), nullable=True))
    op.add_column('submissions', sa.Column('batch_name', sa.String(), nullable=True))
    op.add_column('submissions', sa.Column('teacher_name', sa.String(), nullable=True))
    op.add_column('submissions', sa.Column('include_logo', sa.Boolean(), nullable=True, server_default=sa.text('true')))


def downgrade() -> None:
    op.drop_column('submissions', 'include_logo')
    op.drop_column('submissions', 'teacher_name')
    op.drop_column('submissions', 'batch_name')
    op.drop_column('submissions', 'group_name')
    op.drop_column('submissions', 'subject_code')
    op.drop_column('submissions', 'subject_of_lab')
    op.drop_column('submissions', 'date_of_lab')
    op.drop_column('submissions', 'filename')
    op.drop_column('submissions', 'user_id')

    op.drop_column('users', 'reset_token_expires')
    op.drop_column('users', 'reset_token')
    op.drop_column('users', 'roll_number')
    op.drop_column('users', 'college_logo')
