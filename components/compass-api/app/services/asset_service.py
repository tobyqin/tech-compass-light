from datetime import datetime
from typing import List, Optional

import gridfs
from bson import ObjectId
from fastapi import Depends, HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from pymongo import ASCENDING, DESCENDING

from ..core.mongodb import get_database
from ..models.asset import Asset, AssetInDB


class AssetService:
    def __init__(self, db=Depends(get_database)):
        self.db = db
        self.fs = AsyncIOMotorGridFSBucket(self.db)
        self.collection = self.db.assets

    async def create_indexes(self):
        """Create indexes for the assets collection"""
        await self.collection.create_index([("name", ASCENDING)])
        await self.collection.create_index([("createdAt", DESCENDING)])

    async def save_file(self, file: UploadFile) -> AssetInDB:
        """Save a single file to GridFS and create asset record"""
        try:
            # Read file content
            contents = await file.read()
            file_size = len(contents)

            # Save to GridFS if file is large (>16MB) or regular collection if small
            if file_size > 16 * 1024 * 1024:  # 16MB
                grid_file_id = await self.fs.upload_from_stream(
                    file.filename, contents, metadata={"contentType": file.content_type}
                )
                asset_data = {
                    "name": file.filename,
                    "mimeType": file.content_type,
                    "size": file_size,
                    "gridFSId": grid_file_id,
                    "url": f"/api/assets/{grid_file_id}/download",
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
            else:
                asset_data = {
                    "name": file.filename,
                    "mimeType": file.content_type,
                    "size": file_size,
                    "data": contents,
                    "url": "",  # Will be set after insertion
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }

            # Insert into assets collection
            result = await self.collection.insert_one(asset_data)
            asset_data["_id"] = result.inserted_id

            # Set URL for small files
            if "data" in asset_data:
                asset_data["url"] = f"/api/assets/{result.inserted_id}/download"
                await self.collection.update_one({"_id": result.inserted_id}, {"$set": {"url": asset_data["url"]}})

            return AssetInDB(**asset_data)

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

    async def save_multiple_files(self, files: List[UploadFile]) -> List[AssetInDB]:
        """Save multiple files and return their asset records"""
        assets = []
        for file in files:
            asset = await self.save_file(file)
            assets.append(asset)
        return assets

    async def get_all_assets(self, skip: int = 0, limit: int = 100) -> List[Asset]:
        """Get all assets with pagination"""
        cursor = self.collection.find({}).sort("createdAt", -1).skip(skip).limit(limit)
        assets = []
        async for doc in cursor:
            assets.append(Asset(**doc))
        return assets

    async def get_asset_by_id(self, asset_id: str) -> Optional[Asset]:
        """Get a single asset by ID"""
        if not ObjectId.is_valid(asset_id):
            raise HTTPException(status_code=400, detail="Invalid asset ID")

        asset = await self.collection.find_one({"_id": ObjectId(asset_id)})
        if asset:
            return Asset(**asset)
        return None

    async def get_asset_data(self, asset_id: str) -> bytes:
        """Get the binary data of an asset"""
        if not ObjectId.is_valid(asset_id):
            raise HTTPException(status_code=400, detail="Invalid asset ID")

        asset = await self.collection.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        if "gridFSId" in asset:
            # Get from GridFS
            try:
                grid_out = await self.fs.open_download_stream(asset["gridFSId"])
                contents = await grid_out.read()
                return contents
            except gridfs.NoFile:
                raise HTTPException(status_code=404, detail="Asset file not found in GridFS")
        else:
            # Get from regular collection
            return asset["data"]

    async def delete_asset(self, asset_id: str) -> bool:
        """Delete a single asset"""
        if not ObjectId.is_valid(asset_id):
            raise HTTPException(status_code=400, detail="Invalid asset ID")

        asset = await self.collection.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            return False

        # Delete from GridFS if necessary
        if "gridFSId" in asset:
            try:
                await self.fs.delete(asset["gridFSId"])
            except gridfs.NoFile:
                pass  # File already deleted from GridFS

        # Delete from assets collection
        result = await self.collection.delete_one({"_id": ObjectId(asset_id)})
        return result.deleted_count > 0

    async def delete_multiple_assets(self, asset_ids: List[str]) -> int:
        """Delete multiple assets and return the count of deleted assets"""
        valid_ids = [ObjectId(aid) for aid in asset_ids if ObjectId.is_valid(aid)]
        if not valid_ids:
            return 0

        # Get assets to delete
        assets = await self.collection.find({"_id": {"$in": valid_ids}}).to_list(None)

        # Delete from GridFS
        for asset in assets:
            if "gridFSId" in asset:
                try:
                    await self.fs.delete(asset["gridFSId"])
                except gridfs.NoFile:
                    pass

        # Delete from assets collection
        result = await self.collection.delete_many({"_id": {"$in": valid_ids}})
        return result.deleted_count

    async def count_assets(self) -> int:
        """Get total count of assets"""
        return await self.collection.count_documents({})


# Get AssetService instance
def get_asset_service(db=Depends(get_database)) -> AssetService:
    return AssetService(db)
