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
                try:
                    grid_file_id = await self.fs.upload_from_stream(
                        file.filename, contents, metadata={"contentType": file.content_type}
                    )
                    asset_data = {
                        "name": file.filename,
                        "mimeType": file.content_type,
                        "size": file_size,
                        "gridFSId": str(grid_file_id),
                        "createdAt": datetime.utcnow(),
                        "updatedAt": datetime.utcnow(),
                    }
                except Exception as grid_error:
                    raise HTTPException(status_code=500, detail=f"Error saving to GridFS: {str(grid_error)}")
            else:
                asset_data = {
                    "name": file.filename,
                    "mimeType": file.content_type,
                    "size": file_size,
                    "data": contents,
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }

            try:
                # Insert into assets collection
                result = await self.collection.insert_one(asset_data)
                asset_id = str(result.inserted_id)

                # Create complete asset data including _id
                complete_asset_data = {**asset_data, "_id": asset_id}

                # Create and validate the model
                asset = AssetInDB(**complete_asset_data)
                return asset

            except Exception as db_error:
                raise HTTPException(status_code=500, detail=f"Error saving to database: {str(db_error)}")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unexpected error saving file {file.filename}: {str(e)}")

    async def save_multiple_files(self, files: List[UploadFile]) -> List[Asset]:
        """Save multiple files and return their asset records"""
        assets = []
        saved_assets = []
        try:
            for file in files:
                try:
                    # Save file and get AssetInDB instance
                    asset_in_db = await self.save_file(file)

                    # Create Asset instance directly with the data we have
                    asset = Asset(
                        id=asset_in_db.id,  # Use id field which is aliased to _id
                        name=asset_in_db.name,
                        mimeType=asset_in_db.mimeType,
                        size=asset_in_db.size,
                        gridFSId=asset_in_db.gridFSId,
                        createdAt=asset_in_db.createdAt,
                        updatedAt=asset_in_db.updatedAt,
                    )
                    assets.append(asset)
                    saved_assets.append(asset)
                except Exception as file_error:
                    raise HTTPException(
                        status_code=500, detail=f"Error processing file {file.filename}: {str(file_error)}"
                    )
            return assets

        except Exception as e:
            # Clean up any saved assets if there's an error
            for asset in saved_assets:
                try:
                    await self.delete_asset(str(asset.id))
                except:
                    pass
            raise HTTPException(status_code=500, detail=f"Error in save_multiple_files: {str(e)}")

    async def get_all_assets(self, skip: int = 0, limit: int = 100) -> List[Asset]:
        """Get all assets with pagination"""
        cursor = self.collection.find({}).sort("createdAt", -1).skip(skip).limit(limit)
        assets = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "gridFSId" in doc and doc["gridFSId"]:
                doc["gridFSId"] = str(doc["gridFSId"])
            assets.append(Asset(**doc))
        return assets

    async def get_asset_by_id(self, asset_id: str) -> Optional[Asset]:
        """Get a single asset by ID"""
        if not ObjectId.is_valid(asset_id):
            raise HTTPException(status_code=400, detail="Invalid asset ID")

        asset = await self.collection.find_one({"_id": ObjectId(asset_id)})
        if asset:
            asset["_id"] = str(asset["_id"])
            if "gridFSId" in asset and asset["gridFSId"]:
                asset["gridFSId"] = str(asset["gridFSId"])
            return Asset(**asset)
        return None

    async def get_asset_by_name(self, name: str) -> Optional[Asset]:
        """Get a single asset by name"""
        asset = await self.collection.find_one({"name": name})
        if asset:
            asset["_id"] = str(asset["_id"])
            if "gridFSId" in asset and asset["gridFSId"]:
                asset["gridFSId"] = str(asset["gridFSId"])
            return Asset(**asset)
        return None

    async def get_asset_data(self, asset_id: str) -> bytes:
        """Get the binary data of an asset"""
        try:
            if not ObjectId.is_valid(asset_id):
                raise HTTPException(status_code=400, detail="Invalid asset ID format")

            asset = await self.collection.find_one({"_id": ObjectId(asset_id)})
            if not asset:
                raise HTTPException(status_code=404, detail="Asset not found")

            if "gridFSId" in asset:
                # Get from GridFS
                try:
                    grid_out = await self.fs.open_download_stream(ObjectId(asset["gridFSId"]))
                    contents = await grid_out.read()
                    return contents
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Error retrieving file from GridFS: {str(e)}")
            elif "data" in asset:
                # Get from regular collection
                return asset["data"]
            else:
                raise HTTPException(status_code=500, detail="Asset data not found in expected location")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error retrieving asset data: {str(e)}")

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
