import os
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

# Import app dependencies
from app.core.config import settings
from app.core.security import create_access_token
from main import app

# Set all test environment variables in one place
os.environ["DATABASE_NAME"] = "tc-test"
os.environ["JWT_SECRET_KEY"] = "test_secret_key_for_testing_only"
os.environ["AUTH_SERVER_ENABLED"] = "false"
os.environ["DEFAULT_ADMIN_USERNAME"] = "admin"
os.environ["DEFAULT_ADMIN_PASSWORD"] = "admin123"
os.environ["DEFAULT_ADMIN_EMAIL"] = "admin@techcompass.com"
os.environ["DEFAULT_ADMIN_FULLNAME"] = "System Admin"

# Override settings directly for the current process
settings.DATABASE_NAME = "tc-test"
settings.JWT_SECRET_KEY = "test_secret_key_for_testing_only"
settings.AUTH_SERVER_ENABLED = False
# These should already be set from .env, but we ensure they're set here for tests
settings.DEFAULT_ADMIN_USERNAME = "admin"
settings.DEFAULT_ADMIN_PASSWORD = "admin123"
settings.DEFAULT_ADMIN_EMAIL = "admin@techcompass.com"
settings.DEFAULT_ADMIN_FULLNAME = "System Admin"


@pytest.fixture(scope="module")
def client():
    """Return a test client for the FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def admin_token():
    """Generate a JWT token for the admin user."""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(data={"sub": settings.DEFAULT_ADMIN_USERNAME}, expires_delta=access_token_expires)


@pytest.fixture(scope="function")
def admin_headers(admin_token):
    """Return headers with admin authentication token."""
    return {"Authorization": f"Bearer {admin_token}"}
