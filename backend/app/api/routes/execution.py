import tempfile
import subprocess
import os
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/execute", tags=["execution"])

class ExecuteRequest(BaseModel):
    code: str
    language: str
    stdin: str = ""

class ExecuteResponse(BaseModel):
    stdout: str
    stderr: str

@router.post("", response_model=ExecuteResponse)
def execute_code(req: ExecuteRequest):
    if req.language.lower() not in ["cpp", "c++", "python", "java"]:
        raise HTTPException(status_code=400, detail="Only C++, Python, and Java are supported for execution.")

    # Python execution
    if req.language.lower() == "python":
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w") as f:
            f.write(req.code)
            script_path = f.name
        
        try:
            result = subprocess.run(
                ["python", script_path],
                input=req.stdin,
                text=True,
                capture_output=True,
                timeout=10
            )
            return ExecuteResponse(
                stdout=result.stdout, 
                stderr=result.stderr.replace(script_path, "main.py") if result.stderr else ""
            )
        except subprocess.TimeoutExpired:
            return ExecuteResponse(stdout="", stderr="Execution timed out.")
        finally:
            os.remove(script_path)

    # Java execution
    elif req.language.lower() == "java":
        with tempfile.TemporaryDirectory() as tmpdir:
            import re
            match = re.search(r"public\s+class\s+(\w+)", req.code)
            class_name = match.group(1) if match else "Main"
            src_path = os.path.join(tmpdir, f"{class_name}.java")
            
            with open(src_path, "w") as f:
                f.write(req.code)
                
            try:
                compile_res = subprocess.run(
                    ["javac", src_path],
                    capture_output=True,
                    text=True
                )
            except FileNotFoundError:
                return ExecuteResponse(stdout="", stderr="javac compiler not found on the system. Please install JDK and add it to PATH.")
            
            if compile_res.returncode != 0:
                return ExecuteResponse(stdout="", stderr=compile_res.stderr.replace(src_path, f"{class_name}.java") if compile_res.stderr else "")
                
            try:
                run_res = subprocess.run(
                    ["java", "-cp", tmpdir, class_name],
                    input=req.stdin,
                    text=True,
                    capture_output=True,
                    timeout=10
                )
                return ExecuteResponse(
                    stdout=run_res.stdout, 
                    stderr=run_res.stderr.replace(src_path, f"{class_name}.java") if run_res.stderr else ""
                )
            except subprocess.TimeoutExpired:
                return ExecuteResponse(stdout="", stderr="Execution timed out.")

    # C++ execution
    else:
        with tempfile.TemporaryDirectory() as tmpdir:
            src_path = os.path.join(tmpdir, "main.cpp")
            exe_path = os.path.join(tmpdir, "main.exe")
            
            with open(src_path, "w") as f:
                f.write(req.code)
                
            # Compile
            try:
                compile_res = subprocess.run(
                    ["g++", src_path, "-o", exe_path],
                    capture_output=True,
                    text=True
                )
            except FileNotFoundError:
                return ExecuteResponse(stdout="", stderr="g++ compiler not found on the system. Please install MinGW or GCC and add it to PATH.")
            
            if compile_res.returncode != 0:
                return ExecuteResponse(stdout="", stderr=compile_res.stderr.replace(src_path, "main.cpp") if compile_res.stderr else "")
                
            # Run
            try:
                run_res = subprocess.run(
                    [exe_path],
                    input=req.stdin,
                    text=True,
                    capture_output=True,
                    timeout=10
                )
                return ExecuteResponse(
                    stdout=run_res.stdout, 
                    stderr=run_res.stderr.replace(src_path, "main.cpp") if run_res.stderr else ""
                )
            except subprocess.TimeoutExpired:
                return ExecuteResponse(stdout="", stderr="Execution timed out.")
