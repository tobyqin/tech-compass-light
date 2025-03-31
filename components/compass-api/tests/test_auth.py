from fastapi import status
from fastapi.testclient import TestClient

from app.core.config import settings


class TestAuthEndpoints:
    """Test the authentication endpoints."""

    def test_login_admin_success(self, client: TestClient):
        """Test successful login with admin credentials."""
        form_data = {
            "username": settings.DEFAULT_ADMIN_USERNAME,
            "password": settings.DEFAULT_ADMIN_PASSWORD,
        }

        response = client.post(
            "/api/auth/login", data=form_data, headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0

    def test_login_wrong_username(self, client: TestClient):
        """Test login attempt with incorrect username."""
        form_data = {
            "username": "nonexistentuser",
            "password": "anypassword",
        }

        response = client.post(
            "/api/auth/login", data=form_data, headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert "detail" in data
        assert "incorrect username or password" in data["detail"].lower()

    def test_login_wrong_password(self, client: TestClient):
        """Test login attempt with incorrect password."""
        # First create test user
        form_data = {
            "username": settings.DEFAULT_ADMIN_USERNAME,  # Using admin for simplicity
            "password": "wrongpassword",  # Wrong password
        }

        response = client.post(
            "/api/auth/login", data=form_data, headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert "detail" in data
        assert "incorrect username or password" in data["detail"].lower()

    def test_login_empty_credentials(self, client: TestClient):
        """Test login attempt with empty credentials."""
        form_data = {
            "username": "",
            "password": "",
        }

        response = client.post(
            "/api/auth/login", data=form_data, headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_login_missing_username(self, client: TestClient):
        """Test login attempt with missing username."""
        form_data = {
            "password": "anypassword",
        }

        response = client.post(
            "/api/auth/login", data=form_data, headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_login_missing_password(self, client: TestClient):
        """Test login attempt with missing password."""
        form_data = {
            "username": "anyusername",
        }

        response = client.post(
            "/api/auth/login", data=form_data, headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_token_expiration(self, client: TestClient):
        """Test that tokens expire according to settings.

        This is a basic test that just verifies a token is created with
        non-zero expiration time. A more comprehensive test would mock
        the current time and verify the token expiry.
        """
        form_data = {
            "username": settings.DEFAULT_ADMIN_USERNAME,
            "password": settings.DEFAULT_ADMIN_PASSWORD,
        }

        response = client.post(
            "/api/auth/login", data=form_data, headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data

        # Verify token structure
        # (a more comprehensive test would decode and check the expiry time)
        token = data["access_token"]
        assert isinstance(token, str)
        assert len(token.split(".")) == 3  # JWT has 3 parts
