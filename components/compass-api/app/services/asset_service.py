from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import Depends, HTTPException, UploadFile
from pymongo import ASCENDING, DESCENDING

from ..core.mongodb import get_database
from ..models.asset import Asset, AssetInDB


class AssetService:
    def __init__(self, db=Depends(get_database)):
        self.db = db
        self.collection = self.db.assets

    async def create_indexes(self):
        """Create indexes for the assets collection"""
        await self.collection.create_index([("name", ASCENDING)])
        await self.collection.create_index([("created_at", DESCENDING)])

    async def save_file(self, file: UploadFile, username: Optional[str] = None) -> AssetInDB:
        """Save a file and create asset record"""
        try:
            # Read file content
            contents = await file.read()

            asset_data = {
                "name": file.filename,
                "mime_type": file.content_type,
                "data": contents,
                "created_at": datetime.utcnow(),
                "created_by": username,
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

    async def save_multiple_files(self, files: List[UploadFile], username: Optional[str] = None) -> List[Asset]:
        """Save multiple files and return their asset records"""
        assets = []
        saved_assets = []
        try:
            for file in files:
                try:
                    # Save file and get AssetInDB instance
                    asset_in_db = await self.save_file(file, username)

                    # Create Asset instance directly with the data we have
                    asset = Asset(
                        id=asset_in_db.id,  # Use id field which is aliased to _id
                        name=asset_in_db.name,
                        mime_type=asset_in_db.mime_type,
                        data=asset_in_db.data,
                        created_at=asset_in_db.created_at,
                        updated_at=asset_in_db.updated_at,
                        created_by=asset_in_db.created_by if hasattr(asset_in_db, "created_by") else None,
                        updated_by=asset_in_db.updated_by if hasattr(asset_in_db, "updated_by") else None,
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
        # Only exclude the binary data field, keep all other fields including created_by
        projection = {"data": 0}
        cursor = self.collection.find({}, projection).sort("created_at", -1).skip(skip).limit(limit)
        assets = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            assets.append(Asset(**doc))
        return assets

    async def get_asset_by_id(self, asset_id: str) -> Optional[Asset]:
        """Get a single asset by ID"""
        if not ObjectId.is_valid(asset_id):
            raise HTTPException(status_code=400, detail="Invalid asset ID")

        # Only exclude the binary data field, keep all other fields including created_by
        projection = {"data": 0}
        asset = await self.collection.find_one({"_id": ObjectId(asset_id)}, projection)
        if asset:
            asset["_id"] = str(asset["_id"])
            return Asset(**asset)
        return None

    async def get_asset_by_name(self, name: str) -> Optional[Asset]:
        """Get a single asset by name"""
        asset = await self.collection.find_one({"name": name})
        if asset:
            asset["_id"] = str(asset["_id"])
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

            if "data" in asset:
                return asset["data"]
            else:
                raise HTTPException(status_code=500, detail="Asset data not found")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error retrieving asset data: {str(e)}")

    async def delete_asset(self, asset_id: str, username: Optional[str] = None) -> bool:
        """Delete a single asset"""
        if not ObjectId.is_valid(asset_id):
            raise HTTPException(status_code=400, detail="Invalid asset ID")

        asset = await self.collection.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            return False

        # Delete from assets collection
        result = await self.collection.delete_one({"_id": ObjectId(asset_id)})
        return result.deleted_count > 0

    async def delete_multiple_assets(self, asset_ids: List[str], username: Optional[str] = None) -> int:
        """Delete multiple assets and return the count of deleted assets"""
        valid_ids = [ObjectId(aid) for aid in asset_ids if ObjectId.is_valid(aid)]
        if not valid_ids:
            return 0

        # Delete from assets collection
        result = await self.collection.delete_many({"_id": {"$in": valid_ids}})
        return result.deleted_count

    async def count_assets(self) -> int:
        """Get total count of assets"""
        return await self.collection.count_documents({})


# Get AssetService instance
def get_asset_service(db=Depends(get_database)) -> AssetService:
    return AssetService(db)
