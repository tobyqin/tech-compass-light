from typing import List

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.core.auth import get_current_active_user, get_current_superuser
from app.models.response import StandardResponse
from app.models.site_config import SiteConfigCreate, SiteConfigInDB, SiteConfigUpdate
from app.models.user import User
from app.services.site_config_service import SiteConfigService

router = APIRouter()


@router.get("", response_model=StandardResponse[List[SiteConfigInDB]], tags=["site-config"])
async def get_all_site_configs(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of items to return"),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all site configurations with pagination.
    Requires authentication.
    """
    config_service = SiteConfigService()
    configs = await config_service.get_all_site_configs(skip=skip, limit=limit)
    total = await config_service.count_site_configs()

    return StandardResponse.paginated(configs, total, skip, limit)


@router.get("/{key}", response_model=StandardResponse[List[SiteConfigInDB]], tags=["site-config"])
async def get_site_configs_by_key(
    key: str = Path(..., description="Configuration key"),
    active: bool = Query(False, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of items to return"),
):
    """
    Get site configurations by key.
    This endpoint is public and does not require authentication.
    """
    config_service = SiteConfigService()
    configs = await config_service.get_site_configs_by_key(key=key, active=active, skip=skip, limit=limit)
    total = await config_service.count_site_configs_by_key(key=key, active=active)

    return StandardResponse.paginated(configs, total, skip, limit)


@router.post(
    "", response_model=StandardResponse[SiteConfigInDB], status_code=status.HTTP_201_CREATED, tags=["site-config"]
)
async def create_site_config(config: SiteConfigCreate, current_user: User = Depends(get_current_active_user)):
    """
    Create a new site configuration.
    Requires authentication. The key is specified in the request body.
    """
    config_service = SiteConfigService()
    try:
        new_config = await config_service.create_site_config(config=config, username=current_user.username)
        return StandardResponse.of(new_config)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating site configuration: {str(e)}",
        )


@router.put("/{id}", response_model=StandardResponse[SiteConfigInDB], tags=["site-config"])
async def update_site_config(
    config_update: SiteConfigUpdate,
    id: str = Path(..., description="Configuration ID"),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update a site configuration.
    Requires authentication. Only updates the fields that are provided.
    """
    config_service = SiteConfigService()
    updated_config = await config_service.update_site_config(
        config_id=id, config_update=config_update, username=current_user.username
    )

    if not updated_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site configuration not found")

    return StandardResponse.of(updated_config)


@router.delete("/{id}", response_model=StandardResponse[dict], tags=["site-config"])
async def delete_site_config(
    id: str = Path(..., description="Configuration ID"), current_user: User = Depends(get_current_superuser)
):
    """
    Delete a site configuration.
    Requires superuser authentication.
    """
    config_service = SiteConfigService()
    deleted = await config_service.delete_site_config(config_id=id)

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site configuration not found")

    return StandardResponse.of({"message": "Site configuration deleted successfully"})


@router.post("/reset", response_model=StandardResponse[dict], tags=["site-config"])
async def reset_site_configs(current_user: User = Depends(get_current_superuser)):
    """
    Reset all site configurations.
    Requires superuser authentication. This will delete all existing configurations and create new ones with defaults.
    """
    config_service = SiteConfigService()
    try:
        await config_service.reset_site_configs(username=current_user.username)
        return StandardResponse.of({"message": "Site configurations reset successfully"})
    except NotImplementedError:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Reset functionality is not implemented yet",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting site configurations: {str(e)}",
        )
