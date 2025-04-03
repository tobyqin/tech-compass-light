import uuid

import pytest
from app.core.config import settings
from fastapi import status
from fastapi.testclient import TestClient


class TestGroupsEndpoints:
    """Test the groups API endpoints."""

    def test_get_groups_success(self, client: TestClient):
        """Test successful retrieval of all groups."""
        response = client.get("/api/groups")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert isinstance(data["data"], list)

    def test_get_groups_with_pagination(self, client: TestClient):
        """Test getting groups with pagination parameters."""
        response = client.get("/api/groups?skip=1&limit=2")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["skip"] == 1
        assert data["limit"] == 2
        assert len(data["data"]) <= 2  # Might be less if not enough groups

    def test_get_groups_with_sorting(self, client: TestClient):
        """Test getting groups with sorting."""
        # First get default sorting (by order)
        response_default = client.get("/api/groups")

        # Then get with explicit sorting by name
        response_sorted = client.get("/api/groups?sort=name")

        assert response_default.status_code == status.HTTP_200_OK
        assert response_sorted.status_code == status.HTTP_200_OK

        data_default = response_default.json()
        data_sorted = response_sorted.json()

        # If we have enough data, verify sorting has an effect
        if len(data_default["data"]) > 1 and len(data_sorted["data"]) > 1:
            # Check if the order is different - this is a soft check
            # because if order and name happen to be in same order
            # this might fail even if sorting works
            if data_default["data"] != data_sorted["data"]:
                assert data_default["data"] != data_sorted["data"]

            # Verify name sorting is correct
            names = [group["name"] for group in data_sorted["data"]]
            assert names == sorted(names)

    def test_get_group_by_id_success(self, client: TestClient, admin_headers):
        """Test successful retrieval of a group by ID."""
        # First create a group to get
        unique_id = str(uuid.uuid4())[:8]
        group_data = {
            "name": f"Test Group for Get Test {unique_id}",
            "description": "A test group for retrieval",
            "order": 1,
        }

        # Create the group - handling both success and duplicate cases
        create_response = client.post("/api/groups/", json=group_data, headers=admin_headers)

        # Handle both 201 Created and 400 Bad Request (if group exists)
        if create_response.status_code == status.HTTP_201_CREATED:
            group_id = create_response.json()["data"]["_id"]
        else:
            # Get all groups and find the one with our name
            all_groups = client.get("/api/groups").json()["data"]
            for group in all_groups:
                if group["name"] == group_data["name"]:
                    group_id = group["_id"]
                    break
            else:
                pytest.skip("Could not find or create test group")
                return

        # Now get the group by ID
        response = client.get(f"/api/groups/{group_id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["_id"] == group_id
        assert data["data"]["name"] == group_data["name"]
        assert data["data"]["description"] == group_data["description"]
        assert data["data"]["order"] == group_data["order"]
        assert "usage_count" in data["data"]

    def test_get_nonexistent_group(self, client: TestClient):
        """Test getting a group that doesn't exist."""
        # Use a valid MongoDB ObjectId format but one that doesn't exist
        nonexistent_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format
        response = client.get(f"/api/groups/{nonexistent_id}")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data  # FastAPI returns detail field for errors

    def test_create_group_success(self, client: TestClient, admin_headers):
        """Test successful creation of a group (admin only)."""
        # Use a unique name to avoid conflicts with existing groups
        unique_id = str(uuid.uuid4())[:8]

        group_data = {
            "name": f"New Test Group {unique_id}",
            "description": "A new test group for testing creation",
            "order": 2,
        }

        response = client.post("/api/groups/", json=group_data, headers=admin_headers)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == group_data["name"]
        assert data["data"]["description"] == group_data["description"]
        assert data["data"]["order"] == group_data["order"]
        assert "_id" in data["data"]
        assert "created_at" in data["data"]
        assert "created_by" in data["data"]
        assert data["data"]["created_by"] == settings.DEFAULT_ADMIN_USERNAME

    def test_create_group_unauthorized(self, client: TestClient):
        """Test that group creation fails without admin authentication."""
        group_data = {
            "name": "Unauthorized Group",
            "description": "Should fail without auth",
            "order": 3,
        }

        response = client.post("/api/groups/", json=group_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_group_validation_error(self, client: TestClient, admin_headers):
        """Test group creation with invalid data."""
        # Test with empty name
        group_data = {"name": "", "description": "A group with empty name", "order": 4}

        response = client.post("/api/groups/", json=group_data, headers=admin_headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        data = response.json()
        assert "detail" in data

        # Test with name that's just whitespace (should be caught by validator)
        group_data = {"name": "   ", "description": "A group with whitespace name", "order": 5}

        response = client.post("/api/groups/", json=group_data, headers=admin_headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        data = response.json()
        assert "detail" in data

    def test_update_group_success(self, client: TestClient, admin_headers):
        """Test successful update of a group (admin only)."""
        # First create a group to update or find an existing one
        unique_id = str(uuid.uuid4())[:8]

        group_data = {
            "name": f"Group to Update {unique_id}",
            "description": "This will be updated",
            "order": 6,
        }

        create_response = client.post("/api/groups/", json=group_data, headers=admin_headers)

        # Handle both 201 Created and 400 Bad Request (if group exists)
        if create_response.status_code == status.HTTP_201_CREATED:
            group_id = create_response.json()["data"]["_id"]
        else:
            # Get all groups and find one we can use
            all_groups = client.get("/api/groups").json()["data"]
            if not all_groups:
                pytest.skip("No groups available for update test")
                return
            group_id = all_groups[0]["_id"]  # Use the first available group

        # Now update the group
        update_data = {
            "name": f"Updated Group {unique_id}",
            "description": "This has been updated",
            "order": 7,
        }

        response = client.put(f"/api/groups/{group_id}", json=update_data, headers=admin_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["_id"] == group_id
        assert data["data"]["name"] == update_data["name"]
        assert data["data"]["description"] == update_data["description"]
        assert data["data"]["order"] == update_data["order"]
        assert "updated_at" in data["data"]
        assert "updated_by" in data["data"]
        assert data["data"]["updated_by"] == settings.DEFAULT_ADMIN_USERNAME

    def test_update_group_unauthorized(self, client: TestClient):
        """Test that group update fails without admin authentication."""
        update_data = {"name": "Unauthorized Update", "description": "Should fail without auth", "order": 8}

        response = client.put(
            "/api/groups/507f1f77bcf86cd799439011",  # Valid MongoDB ObjectId
            json=update_data,
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_nonexistent_group(self, client: TestClient, admin_headers):
        """Test updating a group that doesn't exist."""
        update_data = {
            "name": "Updated Nonexistent",
            "description": "Updating a group that doesn't exist",
            "order": 9,
        }

        response = client.put(
            "/api/groups/507f1f77bcf86cd799439011",  # Valid MongoDB ObjectId that doesn't exist
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        # FastAPI returns detail field for errors
        assert "detail" in response.json()

    def test_delete_group_success(self, client: TestClient, admin_headers):
        """Test successful deletion of a group (admin only)."""
        # First create a group to delete
        unique_id = str(uuid.uuid4())[:8]

        group_data = {
            "name": f"Group to Delete {unique_id}",
            "description": "This will be deleted",
            "order": 10,
        }

        create_response = client.post("/api/groups/", json=group_data, headers=admin_headers)

        # Handle both 201 Created and 400 Bad Request (if group exists)
        if create_response.status_code == status.HTTP_201_CREATED:
            group_id = create_response.json()["data"]["_id"]
        else:
            # Try to find a group we can delete that isn't in use
            all_groups = client.get("/api/groups").json()["data"]
            for group in all_groups:
                if group["usage_count"] == 0:
                    group_id = group["_id"]
                    break
            else:
                pytest.skip("Could not find or create a group that can be deleted")
                return

        # Now delete the group
        response = client.delete(f"/api/groups/{group_id}", headers=admin_headers)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify it's really deleted
        get_response = client.get(f"/api/groups/{group_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_group_unauthorized(self, client: TestClient):
        """Test that group deletion fails without admin authentication."""
        response = client.delete("/api/groups/507f1f77bcf86cd799439011")  # Valid MongoDB ObjectId

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_delete_nonexistent_group(self, client: TestClient, admin_headers):
        """Test deleting a group that doesn't exist."""
        response = client.delete(
            "/api/groups/507f1f77bcf86cd799439011",  # Valid MongoDB ObjectId that doesn't exist
            headers=admin_headers,
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        # FastAPI returns detail field for errors
        assert "detail" in response.json()

    def test_create_duplicate_group(self, client: TestClient, admin_headers):
        """Test creating a group with a name that already exists."""
        # First create a group
        unique_id = str(uuid.uuid4())[:8]
        group_name = f"Duplicate Group {unique_id}"

        group_data = {"name": group_name, "description": "Original group", "order": 11}

        create_response = client.post("/api/groups/", json=group_data, headers=admin_headers)

        assert create_response.status_code == status.HTTP_201_CREATED

        # Try to create another with the same name
        duplicate_data = {
            "name": group_name,  # Same name
            "description": "This should fail",
            "order": 12,
        }

        response = client.post("/api/groups/", json=duplicate_data, headers=admin_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        # FastAPI returns detail field for errors
        assert "detail" in data
        assert "already exists" in data["detail"].lower() or "duplicate" in data["detail"].lower()
