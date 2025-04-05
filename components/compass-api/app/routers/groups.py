from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response

from app.core.auth import get_current_superuser
from app.models.group import Group, GroupCreate, GroupUpdate
from app.models.response import StandardResponse
from app.models.user import User
from app.services.group_service import GroupService

router = APIRouter()


@router.post("/", response_model=StandardResponse[Group], status_code=status.HTTP_201_CREATED)
async def create_group(
    group: GroupCreate,
    current_user: User = Depends(get_current_superuser),
    group_service: GroupService = Depends(),
) -> StandardResponse[Group]:
    """Create a new group (superuser only)."""
    try:
        result = await group_service.create_group(group, current_user.username)
        return StandardResponse.of(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=StandardResponse[List[Group]])
async def get_groups(
    skip: int = 0,
    limit: int = 100,
    sort: str = Query("order", description="Sort field (prefix with - for descending order, e.g., name, order, created_at)"),
    group_service: GroupService = Depends(),
) -> StandardResponse[List[Group]]:
    """Get all groups with pagination and sorting. Default sorting is by order ascending."""
    groups = await group_service.get_groups(skip=skip, limit=limit, sort=sort)
    total = await group_service.count_groups()
    return StandardResponse.paginated(data=groups, total=total, skip=skip, limit=limit)


@router.get("/{group_id}", response_model=StandardResponse[Group])
async def get_group(group_id: str, group_service: GroupService = Depends()) -> StandardResponse[Group]:
    """Get a specific group by ID."""
    group = await group_service.get_group_by_id(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return StandardResponse.of(group)


@router.put("/{group_id}", response_model=StandardResponse[Group])
async def update_group(
    group_id: str,
    group_update: GroupUpdate,
    current_user: User = Depends(get_current_superuser),
    group_service: GroupService = Depends(),
) -> StandardResponse[Group]:
    """Update a group by ID (superuser only)."""
    try:
        group = await group_service.update_group_by_id(group_id, group_update, current_user.username)
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        return StandardResponse.of(group)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_group(
    group_id: str,
    current_user: User = Depends(get_current_superuser),
    group_service: GroupService = Depends(),
) -> None:
    """Delete a group by ID (superuser only)."""
    try:
        success = await group_service.delete_group_by_id(group_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))