from fastapi import FastAPI

app = FastAPI(title="Far Labs DeSci Service")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "desci"}


@app.get("/api/desci/grants")
async def list_grants():
    return {
        "grants": [
            {"id": "grant-01", "title": "Decentralized Drug Discovery", "status": "funding"},
            {"id": "grant-02", "title": "Open Genomics Lab", "status": "review"},
        ]
    }
