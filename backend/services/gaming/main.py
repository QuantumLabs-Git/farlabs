from fastapi import FastAPI

app = FastAPI(title="Far Labs Gaming Service")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "gaming"}


@app.get("/api/gaming/tournaments")
async def list_tournaments():
    return {
        "tournaments": [
            {"id": "arena-01", "status": "scheduled", "prize_pool_far": 120_000},
            {"id": "arena-02", "status": "open", "prize_pool_far": 80_000},
        ]
    }
