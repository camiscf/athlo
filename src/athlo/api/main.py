"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from athlo import __version__
from athlo.api.routes.activities import router as activities_router
from athlo.api.routes.auth import router as auth_router
from athlo.api.routes.auth import user_router
from athlo.api.routes.strength import router as strength_router
from athlo.api.routes.body import router as body_router
from athlo.api.routes.goals import router as goals_router
from athlo.config import settings

app = FastAPI(
    title=settings.app_name,
    description="Personal sports tracking API for running, cycling, swimming, and strength training",
    version=__version__,
)

# CORS middleware for web/mobile access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(activities_router)
app.include_router(strength_router)
app.include_router(body_router)
app.include_router(goals_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": __version__}


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.app_name,
        "version": __version__,
        "docs": "/docs",
    }
