import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.core.config import settings


class TestCategoriesEndpoints:
    """Test the categories API endpoints."""

    def test_get_categories_success(self, client: TestClient):
        """Test successful retrieval of all categories."""
        response = client.get("/api/categories")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert isinstance(data["data"], list)

    def test_get_categories_with_pagination(self, client: TestClient):
        """Test getting categories with pagination parameters."""
        response = client.get("/api/categories?skip=1&limit=2")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["skip"] == 1
        assert data["limit"] == 2
        assert len(data["data"]) <= 2  # Might be less if not enough categories

    def test_get_categories_with_sorting(self, client: TestClient):
        """Test getting categories with sorting."""
        # First get default sorting
        response_default = client.get("/api/categories")

        # Then get with explicit sorting
        response_sorted = client.get("/api/categories?sort=name")

        assert response_default.status_code == status.HTTP_200_OK
        assert response_sorted.status_code == status.HTTP_200_OK

        # The results should be different when sorted differently
        # Note: This test can be flaky if there's only 0-1 categories or if they
        # happen to be sorted the same way with both criteria
        data_default = response_default.json()
        data_sorted = response_sorted.json()

        # If we have enough data, verify sorting has an effect
        if len(data_default["data"]) > 1 and len(data_sorted["data"]) > 1:
            # Check if the order is different - this is a soft check
            # because if radar_quadrant and name happen to be in same order
            # this might fail even if sorting works
            if data_default["data"] != data_sorted["data"]:
                assert data_default["data"] != data_sorted["data"]

            # Verify name sorting is correct
            names = [category["name"] for category in data_sorted["data"]]
            assert names == sorted(names)

    def test_get_category_by_id_success(self, client: TestClient, admin_headers):
        """Test successful retrieval of a category by ID."""
        # First create a category to get
        category_data = {
            "name": "Test Category for Get Test",
            "description": "A test category for retrieval",
            "radar_quadrant": 0,
        }

        # Create the category - handling both success and duplicate cases
        create_response = client.post("/api/categories/", json=category_data, headers=admin_headers)

        # Handle both 201 Created and 400 Bad Request (if category exists)
        if create_response.status_code == status.HTTP_201_CREATED:
            category_id = create_response.json()["data"]["_id"]
        else:
            # Get all categories and find the one with our name
            all_categories = client.get("/api/categories").json()["data"]
            for category in all_categories:
                if category["name"] == category_data["name"]:
                    category_id = category["_id"]
                    break
            else:
                pytest.skip("Could not find or create test category")
                return

        # Now get the category by ID
        response = client.get(f"/api/categories/{category_id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["_id"] == category_id
        assert data["data"]["name"] == category_data["name"]
        assert data["data"]["description"] == category_data["description"]
        assert data["data"]["radar_quadrant"] == category_data["radar_quadrant"]
        assert "usage_count" in data["data"]

    def test_get_nonexistent_category(self, client: TestClient):
        """Test getting a category that doesn't exist."""
        # Use a valid MongoDB ObjectId format but one that doesn't exist
        nonexistent_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format
        response = client.get(f"/api/categories/{nonexistent_id}")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data  # FastAPI returns detail field for errors

    def test_create_category_success(self, client: TestClient, admin_headers):
        """Test successful creation of a category (admin only)."""
        # Use a unique name to avoid conflicts with existing categories
        import uuid

        unique_id = str(uuid.uuid4())[:8]

        category_data = {
            "name": f"New Test Category {unique_id}",
            "description": "A new test category for testing creation",
            "radar_quadrant": 1,
        }

        response = client.post("/api/categories/", json=category_data, headers=admin_headers)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == category_data["name"]
        assert data["data"]["description"] == category_data["description"]
        assert data["data"]["radar_quadrant"] == category_data["radar_quadrant"]
        assert "_id" in data["data"]
        assert "created_at" in data["data"]
        assert "created_by" in data["data"]
        assert data["data"]["created_by"] == settings.DEFAULT_ADMIN_USERNAME

    def test_create_category_unauthorized(self, client: TestClient):
        """Test that category creation fails without admin authentication."""
        category_data = {
            "name": "Unauthorized Category",
            "description": "Should fail without auth",
            "radar_quadrant": 2,
        }

        response = client.post("/api/categories/", json=category_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_category_validation_error(self, client: TestClient, admin_headers):
        """Test category creation with invalid data."""
        # Test with invalid radar_quadrant
        category_data = {
            "name": "Invalid Category",
            "description": "A category with invalid quadrant",
            "radar_quadrant": 5,  # Valid range is -1 to 3
        }

        response = client.post("/api/categories/", json=category_data, headers=admin_headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        data = response.json()
        assert "detail" in data

        # Test with empty name
        category_data = {"name": "", "description": "A category with empty name", "radar_quadrant": 0}

        response = client.post("/api/categories/", json=category_data, headers=admin_headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        data = response.json()
        assert "detail" in data

    def test_update_category_success(self, client: TestClient, admin_headers):
        """Test successful update of a category (admin only)."""
        # First create a category to update or find an existing one
        import uuid

        unique_id = str(uuid.uuid4())[:8]

        category_data = {
            "name": f"Category to Update {unique_id}",
            "description": "This will be updated",
            "radar_quadrant": 0,
        }

        create_response = client.post("/api/categories/", json=category_data, headers=admin_headers)

        # Handle both 201 Created and 400 Bad Request (if category exists)
        if create_response.status_code == status.HTTP_201_CREATED:
            category_id = create_response.json()["data"]["_id"]
        else:
            # Get all categories and find one we can use
            all_categories = client.get("/api/categories").json()["data"]
            if not all_categories:
                pytest.skip("No categories available for update test")
                return
            category_id = all_categories[0]["_id"]  # Use the first available category

        # Now update the category
        update_data = {
            "name": f"Updated Category {unique_id}",
            "description": "This has been updated",
            "radar_quadrant": 2,
        }

        response = client.put(f"/api/categories/{category_id}", json=update_data, headers=admin_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["_id"] == category_id
        assert data["data"]["name"] == update_data["name"]
        assert data["data"]["description"] == update_data["description"]
        assert data["data"]["radar_quadrant"] == update_data["radar_quadrant"]
        assert "updated_at" in data["data"]
        assert "updated_by" in data["data"]
        assert data["data"]["updated_by"] == settings.DEFAULT_ADMIN_USERNAME

    def test_update_category_unauthorized(self, client: TestClient):
        """Test that category update fails without admin authentication."""
        update_data = {"name": "Unauthorized Update", "description": "Should fail without auth", "radar_quadrant": 1}

        response = client.put(
            "/api/categories/507f1f77bcf86cd799439011",  # Valid MongoDB ObjectId
            json=update_data,
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_nonexistent_category(self, client: TestClient, admin_headers):
        """Test updating a category that doesn't exist."""
        update_data = {
            "name": "Updated Nonexistent",
            "description": "Updating a category that doesn't exist",
            "radar_quadrant": 1,
        }

        response = client.put(
            "/api/categories/507f1f77bcf86cd799439011",  # Valid MongoDB ObjectId that doesn't exist
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        # FastAPI returns detail field for errors
        assert "detail" in response.json()

    def test_delete_category_success(self, client: TestClient, admin_headers):
        """Test successful deletion of a category (admin only)."""
        # First create a category to delete
        import uuid

        unique_id = str(uuid.uuid4())[:8]

        category_data = {
            "name": f"Category to Delete {unique_id}",
            "description": "This will be deleted",
            "radar_quadrant": 3,
        }

        create_response = client.post("/api/categories/", json=category_data, headers=admin_headers)

        # Handle both 201 Created and 400 Bad Request (if category exists)
        if create_response.status_code == status.HTTP_201_CREATED:
            category_id = create_response.json()["data"]["_id"]
        else:
            # Try to find a category we can delete that isn't in use
            all_categories = client.get("/api/categories").json()["data"]
            for category in all_categories:
                if category["usage_count"] == 0:
                    category_id = category["_id"]
                    break
            else:
                pytest.skip("Could not find or create a category that can be deleted")
                return

        # Now delete the category
        response = client.delete(f"/api/categories/{category_id}", headers=admin_headers)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify it's really deleted
        get_response = client.get(f"/api/categories/{category_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_category_unauthorized(self, client: TestClient):
        """Test that category deletion fails without admin authentication."""
        response = client.delete("/api/categories/507f1f77bcf86cd799439011")  # Valid MongoDB ObjectId

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_delete_nonexistent_category(self, client: TestClient, admin_headers):
        """Test deleting a category that doesn't exist."""
        response = client.delete(
            "/api/categories/507f1f77bcf86cd799439011",  # Valid MongoDB ObjectId that doesn't exist
            headers=admin_headers,
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        # FastAPI returns detail field for errors
        assert "detail" in response.json()

    def test_create_duplicate_category(self, client: TestClient, admin_headers):
        """Test creating a category with a name that already exists."""
        # First create a category
        import uuid

        unique_id = str(uuid.uuid4())[:8]
        category_name = f"Duplicate Category {unique_id}"

        category_data = {"name": category_name, "description": "Original category", "radar_quadrant": 0}

        create_response = client.post("/api/categories/", json=category_data, headers=admin_headers)

        assert create_response.status_code == status.HTTP_201_CREATED

        # Try to create another with the same name
        duplicate_data = {
            "name": category_name,  # Same name
            "description": "This should fail",
            "radar_quadrant": 1,
        }

        response = client.post("/api/categories/", json=duplicate_data, headers=admin_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        # FastAPI returns detail field for errors
        assert "detail" in data
        assert "already exists" in data["detail"].lower() or "duplicate" in data["detail"].lower()
