from pathlib import Path
from uuid import UUID

from jinja2 import Environment, FileSystemLoader
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import ClassNotFound, get_lexer_by_name, guess_lexer
from weasyprint import CSS, HTML

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
STORAGE_DIR = Path(__file__).parent.parent.parent.parent / "storage"

# Ensure storage dir exists
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))


import json

def generate_pdf(  # noqa: PLR0913
    submission_id: UUID,
    aim: str,
    algorithm: str,
    code: str,
    output: str,
    result: str,
    template_name: str,
    metadata: dict = None
) -> str:
    """
    Generates a PDF synchronously for Phase 1 MVP.
    Returns the file path of the generated PDF.
    """
    metadata = metadata or {}
    
    formatter = HtmlFormatter(style="colorful")
    code_css = formatter.get_style_defs(".highlight")
    
    is_multi_problem = aim == 'MULTI_PROBLEM'
    problems = []
    
    if is_multi_problem:
        try:
            raw_problems = json.loads(code)
            for p in raw_problems:
                try:
                    lexer = get_lexer_by_name("cpp") # Using cpp default for OOPS lab
                except ClassNotFound:
                    lexer = guess_lexer(p.get("code", ""))
                p["formatted_code"] = highlight(p.get("code", ""), lexer, formatter)
                problems.append(p)
        except Exception as e:
            print("Failed to parse multi-problem JSON:", e)
            is_multi_problem = False
    else:
        try:
            lexer = get_lexer_by_name("python")
        except ClassNotFound:
            lexer = guess_lexer(code)
        code = highlight(code, lexer, formatter)

    # Load and render template
    template = env.get_template(template_name)
    html_content = template.render(
        aim=aim,
        algorithm=algorithm,
        code=code,
        output=output,
        result=result,
        is_multi_problem=is_multi_problem,
        problems=problems,
        **metadata
    )

    # Render PDF via WeasyPrint
    pdf_path = STORAGE_DIR / f"{submission_id}.pdf"
    HTML(string=html_content).write_pdf(
        target=str(pdf_path),
        stylesheets=[CSS(string=code_css)],
    )

    return str(pdf_path)
