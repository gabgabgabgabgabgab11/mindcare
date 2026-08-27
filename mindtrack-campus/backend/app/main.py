from fastapi import FastAPI

app = FastAPI(title="MindTrack Campus API", version="0.1.0")


@app.get("/health")
def health_check():
    """Basic liveness check. Confirms the API process is running.
    Database connectivity is NOT checked here — that's a separate
    /health/db endpoint added in a later phase."""
    return {"status": "ok"}