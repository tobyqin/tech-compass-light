from io import BytesIO
from typing import List

from app.core.auth import get_current_superuser
from app.models.asset import Asset
from app.models.response import StandardResponse
from app.models.user import User
from app.services.asset_service import AssetService, get_asset_service
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response, StreamingResponse

router = APIRouter()


@router.get("/", response_model=StandardResponse[List[Asset]])
async def get_assets(
    skip: int = 0, limit: int = 100, asset_service: AssetService = Depends(get_asset_service)
) -> StandardResponse[List[Asset]]:
    """
    Retrieve all assets with pagination.
    """
    assets = await asset_service.get_all_assets(skip=skip, limit=limit)
    total = await asset_service.count_assets()
    return StandardResponse.paginated(data=assets, total=total, skip=skip, limit=limit)


@router.post("/upload", response_model=StandardResponse[Asset], status_code=status.HTTP_201_CREATED)
async def upload_asset(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_superuser),
    asset_service: AssetService = Depends(get_asset_service),
) -> StandardResponse[Asset]:
    """
    Upload a single asset (superuser only).
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files are allowed")
    asset = await asset_service.save_file(file)
    return StandardResponse.of(asset)


@router.post("/upload-multiple", response_model=StandardResponse[List[Asset]], status_code=status.HTTP_201_CREATED)
async def upload_multiple_assets(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_superuser),
    asset_service: AssetService = Depends(get_asset_service),
) -> StandardResponse[List[Asset]]:
    """
    Upload multiple assets (superuser only).
    """
    for file in files:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File {file.filename} is not an image")
    assets = await asset_service.save_multiple_files(files)
    return StandardResponse.of(assets)


@router.get("/{asset_id}/download")
async def download_asset(asset_id: str, asset_service: AssetService = Depends(get_asset_service)):
    """
    Download an asset by ID.
    """
    asset = await asset_service.get_asset_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    content = await asset_service.get_asset_data(asset_id)
    return StreamingResponse(
        BytesIO(content),
        media_type=asset.mimeType,
        headers={"Content-Disposition": f'attachment; filename="{asset.name}"'},
    )


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_asset(
    asset_id: str,
    current_user: User = Depends(get_current_superuser),
    asset_service: AssetService = Depends(get_asset_service),
) -> None:
    """
    Delete a single asset (superuser only).
    """
    success = await asset_service.delete_asset(asset_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")


@router.post("/delete-multiple", response_model=StandardResponse[dict])
async def delete_multiple_assets(
    asset_ids: List[str],
    current_user: User = Depends(get_current_superuser),
    asset_service: AssetService = Depends(get_asset_service),
) -> StandardResponse[dict]:
    """
    Delete multiple assets (superuser only).
    """
    deleted_count = await asset_service.delete_multiple_assets(asset_ids)
    return StandardResponse.of({"message": f"Deleted {deleted_count} assets successfully"})
