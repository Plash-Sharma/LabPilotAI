import json
import logging
from pathlib import Path
from uuid import UUID

from jinja2 import Environment, FileSystemLoader
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import ClassNotFound, TextLexer, get_lexer_by_name, guess_lexer
from weasyprint import CSS, HTML

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
STORAGE_DIR = Path(__file__).parent.parent.parent.parent / "storage"

# Ensure storage dir exists
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))


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
    Generates a PDF synchronously for lab submission.
    Returns the file path of the generated PDF.
    """
    metadata = metadata or {}
    
    formatter = HtmlFormatter(style="colorful", cssclass="highlight", nowrap=False)
    code_css = formatter.get_style_defs(".highlight")
    
    # 1. Parse problems from code if serialized as JSON
    raw_problems = []
    if isinstance(code, str):
        trimmed = code.strip()
        if trimmed.startswith("[") or trimmed.startswith("{"):
            try:
                parsed = json.loads(trimmed)
                if isinstance(parsed, list):
                    raw_problems = parsed
                elif isinstance(parsed, dict):
                    raw_problems = [parsed]
            except Exception as e:
                logger.warning("Could not parse code as JSON problems: %s", e)

    # Fallback to single problem if not a JSON problem list
    if not raw_problems:
        raw_problems = [
            {
                "aim": aim or "Laboratory Practical",
                "question": aim or "Laboratory Practical",
                "code": code,
                "stdin": "",
                "output": output,
                "language": "cpp"
            }
        ]

    # 2. Process and highlight each problem individually
    problems = []
    for idx, p in enumerate(raw_problems):
        prob_aim = p.get("aim") or p.get("question") or (f"Problem {idx + 1}" if len(raw_problems) > 1 else aim)
        
        prob_code = p.get("code", "")
        if isinstance(prob_code, str):
            prob_code = prob_code.replace("\r\n", "\n").replace("\r", "\n").expandtabs(4)
        else:
            prob_code = str(prob_code)

        # Determine appropriate Pygments lexer
        lang = (p.get("language") or "cpp").lower()
        if lang in ("cpp", "c++", "c"):
            lexer = get_lexer_by_name("cpp")
        elif lang in ("python", "py"):
            lexer = get_lexer_by_name("python")
        elif lang in ("java",):
            lexer = get_lexer_by_name("java")
        elif lang in ("javascript", "js"):
            lexer = get_lexer_by_name("javascript")
        else:
            try:
                lexer = get_lexer_by_name(lang)
            except ClassNotFound:
                try:
                    lexer = guess_lexer(prob_code)
                except Exception:
                    lexer = TextLexer()

        formatted_code = highlight(prob_code, lexer, formatter)
        
        prob_stdin = p.get("stdin") or p.get("input") or ""
        prob_output = p.get("output", "")

        problems.append({
            "index": idx + 1,
            "aim": prob_aim,
            "question": prob_aim,
            "code": prob_code,
            "formatted_code": formatted_code,
            "stdin": prob_stdin,
            "output": prob_output,
        })

    is_multi_problem = len(problems) > 1

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
        code_css=code_css,
        **metadata
    )

    # Render PDF via WeasyPrint
    pdf_path = STORAGE_DIR / f"{submission_id}.pdf"
    HTML(string=html_content).write_pdf(
        target=str(pdf_path),
        stylesheets=[CSS(string=code_css)],
    )

    return str(pdf_path)
