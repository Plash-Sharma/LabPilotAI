"""
Unit tests for pdf_service.py — verifies file creation, size, and uniqueness per submission.

WeasyPrint requires GTK/Pango on Windows (MSYS2: mingw-w64-ucrt-x86_64-pango).
On Linux CI it works natively.
"""
import uuid
from pathlib import Path

import pytest

from app.services.pdf_service import STORAGE_DIR, generate_pdf

TMPL = "nit_jalandhar_default.html"


@pytest.fixture(autouse=True)
def cleanup_pdfs() -> pytest.FixtureYield:
    """Remove any test PDFs after each test."""
    yield
    for f in STORAGE_DIR.glob("*.pdf"):
        f.unlink(missing_ok=True)


def test_generate_pdf_returns_path() -> None:
    sub_id = uuid.uuid4()
    path = generate_pdf(
        submission_id=sub_id,
        aim="To study Python lists.",
        algorithm="1. Define a list\n2. Append elements\n3. Print",
        code="data = [1, 2, 3]\nprint(data)",
        output="[1, 2, 3]",
        result="The program ran successfully.",
        template_name=TMPL,
    )
    assert path.endswith(".pdf"), f"Expected .pdf path, got: {path}"
    assert Path(path).exists(), "PDF file does not exist on disk"


def test_generate_pdf_is_nonempty() -> None:
    sub_id = uuid.uuid4()
    path = generate_pdf(
        submission_id=sub_id,
        aim="To study loops.",
        algorithm="1. Loop from 1 to 10\n2. Print each number",
        code="for i in range(1, 11):\n    print(i)",
        output="1\n2\n3\n4\n5\n6\n7\n8\n9\n10",
        result="Loop executed correctly.",
        template_name=TMPL,
    )
    size = Path(path).stat().st_size
    assert size > 1000, f"PDF is suspiciously small ({size} bytes)"


def test_generate_pdf_unique_per_submission() -> None:
    """Two different submission IDs must produce two different files."""
    id1, id2 = uuid.uuid4(), uuid.uuid4()
    tmpl = TMPL
    p1 = generate_pdf(id1, "Aim A", "Algo A", "code_a = 1", "out a", "res a", tmpl)
    p2 = generate_pdf(id2, "Aim B", "Algo B", "code_b = 2", "out b", "res b", tmpl)
    assert Path(p1) != Path(p2)
    assert Path(p1).exists() and Path(p2).exists()
