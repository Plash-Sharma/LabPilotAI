"""
seed.py — inserts the default templates into the database.
Run once after running Alembic migrations:
    python -m app.core.seed
"""
import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models import Template

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
