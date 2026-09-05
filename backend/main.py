import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from backend.database import engine
from backend.models import Base
from backend.routers import auth_router, users, suppliers, products, warehouses, stock, shipments, orders, disruptions, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Supply Chain Disruption Response Assistant", version="1.0.0", docs_url=None if os.getenv("APP_ENV") == "production" else "/docs", redoc_url=None if os.getenv("APP_ENV") == "production" else "/redoc")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if os.getenv("APP_ENV") == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)

allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(suppliers.router)
app.include_router(products.router)
app.include_router(warehouses.router)
app.include_router(stock.router)
app.include_router(shipments.router)
app.include_router(orders.router)
app.include_router(disruptions.router)
app.include_router(dashboard.router)

# Serve React build
dist_path = Path(__file__).parent.parent / "dist"
if dist_path.exists() and os.getenv("APP_ENV") != "development":
    app.mount("/assets", StaticFiles(directory=dist_path / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        index = dist_path / "index.html"
        return FileResponse(str(index))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
