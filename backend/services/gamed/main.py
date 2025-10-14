from fastapi import FastAPI

app = FastAPI(title="Far Labs GameD Service")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "gamed"}


@app.get("/api/gamed/catalog")
async def list_catalog():
    return {
        "catalog": [
            {"id": "game-01", "title": "Farcana Prime", "price_far": 280},
            {"id": "game-02", "title": "Gridborn", "price_far": 190},
        ]
    }
