from fastapi import FastAPI

app = FastAPI(title="LabPilotAI API")

@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Hello from LabPilotAI"}

@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
