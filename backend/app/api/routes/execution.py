import logging
import os
import subprocess
import tempfile
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.rate_limit import code_execution_limiter, get_client_ip
from app.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/execute", tags=["execution"])


class ExecuteRequest(BaseModel):
    code: str
    language: str
    stdin: str = ""


class ExecuteResponse(BaseModel):
    stdout: str
    stderr: str


@router.post("", response_model=ExecuteResponse)
async def execute_code(
    req: ExecuteRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Execute user code.
    
    SECURITY POLICY:
    Arbitrary subprocess execution on the application server host is strictly disabled
    in production to prevent remote code execution, host environment variable leakage,
    database access, and resource exhaustion.
    
    If an external isolated container runner (such as an unprivileged Piston instance)
    is configured via PISTON_API_URL, the request is delegated there safely.
    Otherwise, users are guided to run code in their local IDE and paste the verified output.
    """
    lang = req.language.lower().strip()
    if lang not in ["cpp", "c++", "python", "py", "java"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only C++, Python, and Java are supported for execution."
        )

    # 1. Enforce strict rate limiting per authenticated user / client IP
    client_ip = get_client_ip(request)
    code_execution_limiter.check(
        f"{current_user.id}:{client_ip}",
        custom_message="Too many code execution requests. Please wait a minute before trying again."
    )

    # 2. If an isolated external runner (e.g. private Piston container) is configured
    piston_url = os.getenv("PISTON_API_URL")
    if piston_url:
        lang_map = {
            "cpp": "cpp",
            "c++": "cpp",
            "python": "python",
            "py": "python",
            "java": "java",
        }
        target_lang = lang_map.get(lang, "python")
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{piston_url.rstrip('/')}/api/v2/piston/execute",
                    json={
                        "language": target_lang,
                        "version": "*",
                        "files": [{"content": req.code}],
                        "stdin": req.stdin,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    run_data = data.get("run", {})
                    compile_data = data.get("compile", {})
                    stdout = run_data.get("stdout", "")
                    stderr = compile_data.get("stderr") or run_data.get("stderr") or ""
                    return ExecuteResponse(stdout=stdout, stderr=stderr)
        except Exception as e:
            logger.warning("External isolated code runner failed: %s", e)

    # 3. Check if server-side execution is enabled (DISABLED by default in production)
    enable_server_exec = os.getenv("ENABLE_SERVER_EXECUTION", "false").lower() in ("true", "1")
    if not enable_server_exec:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Server-side code execution is disabled in production to protect system integrity. "
                "Please run your code in your local development IDE and paste the verified output."
            )
        )

    # 4. If explicitly enabled for local development or an isolated test container:
    # STRIP THE ENVIRONMENT COMPLETELY so user code CANNOT access host secrets
    # (no DATABASE_URL, GEMINI_API_KEY, SECRET_KEY, AWS_* variables)
    stripped_env = {
        "PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
        "LANG": "C.UTF-8",
        "LC_ALL": "C.UTF-8",
        "PYTHONIOENCODING": "utf-8",
    }

    # Python execution in stripped environment
    if lang in ("python", "py"):
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w", encoding="utf-8") as f:
            f.write(req.code)
            script_path = f.name
        
        try:
            result = subprocess.run(
                ["python", script_path],
                input=req.stdin,
                text=True,
                capture_output=True,
                timeout=5,
                env=stripped_env
            )
            return ExecuteResponse(
                stdout=result.stdout, 
                stderr=result.stderr.replace(script_path, "main.py") if result.stderr else ""
            )
        except subprocess.TimeoutExpired:
            return ExecuteResponse(stdout="", stderr="Execution timed out (5s limit).")
        finally:
            if os.path.exists(script_path):
                os.remove(script_path)

    # Java execution in stripped environment
    elif lang == "java":
        with tempfile.TemporaryDirectory() as tmpdir:
            import re
            match = re.search(r"public\s+class\s+(\w+)", req.code)
            class_name = match.group(1) if match else "Main"
            src_path = os.path.join(tmpdir, f"{class_name}.java")
            
            with open(src_path, "w", encoding="utf-8") as f:
                f.write(req.code)
                
            try:
                compile_res = subprocess.run(
                    ["javac", src_path],
                    capture_output=True,
                    text=True,
                    timeout=5,
                    env=stripped_env
                )
            except FileNotFoundError:
                return ExecuteResponse(stdout="", stderr="javac compiler not found on the system.")
            
            if compile_res.returncode != 0:
                return ExecuteResponse(
                    stdout="", 
                    stderr=compile_res.stderr.replace(src_path, f"{class_name}.java") if compile_res.stderr else "Compilation error."
                )
                
            try:
                run_res = subprocess.run(
                    ["java", "-cp", tmpdir, class_name],
                    input=req.stdin,
                    text=True,
                    capture_output=True,
                    timeout=5,
                    env=stripped_env
                )
                return ExecuteResponse(
                    stdout=run_res.stdout, 
                    stderr=run_res.stderr.replace(src_path, f"{class_name}.java") if run_res.stderr else ""
                )
            except subprocess.TimeoutExpired:
                return ExecuteResponse(stdout="", stderr="Execution timed out (5s limit).")

    # C++ execution in stripped environment
    else:
        with tempfile.TemporaryDirectory() as tmpdir:
            src_path = os.path.join(tmpdir, "main.cpp")
            exe_path = os.path.join(tmpdir, "main.exe" if os.name == "nt" else "main.out")
            
            with open(src_path, "w", encoding="utf-8") as f:
                f.write(req.code)
                
            try:
                compile_res = subprocess.run(
                    ["g++", src_path, "-o", exe_path],
                    capture_output=True,
                    text=True,
                    timeout=5,
                    env=stripped_env
                )
            except FileNotFoundError:
                return ExecuteResponse(stdout="", stderr="g++ compiler not found on the system.")
            
            if compile_res.returncode != 0:
                return ExecuteResponse(
                    stdout="", 
                    stderr=compile_res.stderr.replace(src_path, "main.cpp") if compile_res.stderr else "Compilation error."
                )
                
            try:
                run_res = subprocess.run(
                    [exe_path],
                    input=req.stdin,
                    text=True,
                    capture_output=True,
                    timeout=5,
                    env=stripped_env
                )
                return ExecuteResponse(
                    stdout=run_res.stdout, 
                    stderr=run_res.stderr.replace(src_path, "main.cpp") if run_res.stderr else ""
                )
            except subprocess.TimeoutExpired:
                return ExecuteResponse(stdout="", stderr="Execution timed out (5s limit).")
