"""
seed.py — inserts the default templates into the database.
Run once after running Alembic migrations:
    python -m app.core.seed
"""
import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal, Base, engine
from app.models import Template, User, Submission, LabSession, MCQTest, MCQAttempt, MCQQuestion, VivaQuestion

DEFAULT_TEMPLATES = [
    {
        "name": "NIT Jalandhar Default",
        "college_scope": "NIT Jalandhar",
        "layout_config": {"template_file": "nit_jalandhar_default.html"},
    },
    {
        "name": "Generic Minimal",
        "college_scope": "Generic",
        "layout_config": {"template_file": "generic_minimal.html"},
    },
]


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        for tpl in DEFAULT_TEMPLATES:
            existing = await db.execute(
                select(Template).where(Template.name == tpl["name"])
            )
            if existing.scalars().first() is None:
                db.add(Template(**tpl))
                print(f"  Seeded template: {tpl['name']}")
            else:
                print(f"  Template already exists: {tpl['name']}")
        await db.commit()
    print("Seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed())
