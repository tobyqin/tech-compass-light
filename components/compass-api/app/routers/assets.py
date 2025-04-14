from typing import List

from app.core.auth import get_current_superuser
from app.models.asset import Asset
from app.models.response import StandardResponse
from app.models.user import User
from app.services.asset_service import AssetService, get_asset_service
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from pydantic import BaseModel

router = APIRouter()


class DeleteMultipleRequest(BaseModel):
    asset_ids: List[str]


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


@router.get("/{asset_id}")
async def get_image(asset_id: str, asset_service: AssetService = Depends(get_asset_service)):
    """
    Get image content by ID.
    """
    try:
        asset = await asset_service.get_asset_by_id(asset_id)
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

        content = await asset_service.get_asset_data(asset_id)
        if not content:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset content not found")

        return Response(
            content=content, media_type=asset.mimeType, headers={"Cache-Control": "public, max-age=31536000"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error retrieving image: {str(e)}"
        )


@router.get("/name/{name}", response_model=StandardResponse[Asset])
async def get_asset_by_name(
    name: str, asset_service: AssetService = Depends(get_asset_service)
) -> StandardResponse[Asset]:
    """
    Get asset metadata by name.
    """
    try:
        asset = await asset_service.get_asset_by_name(name)
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
        return StandardResponse.of(asset)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error retrieving asset: {str(e)}"
        )


@router.get("/name/{name}/data")
async def get_asset_data_by_name(name: str, asset_service: AssetService = Depends(get_asset_service)):
    """
    Get asset binary data by name.
    """
    try:
        asset = await asset_service.get_asset_by_name(name)
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

        content = await asset_service.get_asset_data(str(asset.id))
        if not content:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset content not found")

        return Response(
            content=content, media_type=asset.mimeType, headers={"Cache-Control": "public, max-age=31536000"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error retrieving asset data: {str(e)}"
        )


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
    request: DeleteMultipleRequest,
    current_user: User = Depends(get_current_superuser),
    asset_service: AssetService = Depends(get_asset_service),
) -> StandardResponse[dict]:
    """
    Delete multiple assets (superuser only).
    """
    deleted_count = await asset_service.delete_multiple_assets(request.asset_ids)
    return StandardResponse.of({"message": f"Deleted {deleted_count} assets successfully"})
