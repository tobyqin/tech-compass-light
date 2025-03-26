from datetime import datetime
from typing import Optional, List, Dict, Any

from bson import ObjectId

from app.core.database import get_database
from app.models.site_config import SiteConfigBase, SiteConfigInDB, SiteConfigUpdate, SiteConfigCreate


class SiteConfigService:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.site_config

    async def get_all_site_configs(self, skip: int = 0, limit: int = 100) -> List[SiteConfigInDB]:
        """Get all site configurations with pagination"""
        cursor = self.collection.find().skip(skip).limit(limit)
        configs = await cursor.to_list(length=limit)
        return [SiteConfigInDB(**config) for config in configs]
    
    async def count_site_configs(self) -> int:
        """Count total number of site configurations"""
        return await self.collection.count_documents({})

    async def get_site_configs_by_key(self, key: str, active_only: bool = False, 
                                     skip: int = 0, limit: int = 100) -> List[SiteConfigInDB]:
        """Get site configurations by key"""
        query = {"key": key}
        if active_only:
            query["active"] = True
            
        cursor = self.collection.find(query).skip(skip).limit(limit)
        configs = await cursor.to_list(length=limit)
        return [SiteConfigInDB(**config) for config in configs]
    
    async def count_site_configs_by_key(self, key: str, active_only: bool = False) -> int:
        """Count site configurations by key"""
        query = {"key": key}
        if active_only:
            query["active"] = True
        return await self.collection.count_documents(query)

    async def get_site_config_by_id(self, config_id: str) -> Optional[SiteConfigInDB]:
        """Get a site configuration by ID"""
        config = await self.collection.find_one({"id": config_id})
        if config:
            return SiteConfigInDB(**config)
        return None

    async def create_site_config(self, config: SiteConfigCreate, username: str) -> SiteConfigInDB:
        """Create a new site configuration"""
        now = datetime.utcnow()
        config_dict = config.model_dump()
        
        # Check if an active config with the same key and value already exists
        active_config = await self.collection.find_one({
            "key": config.key,
            "value": config.value,
            "active": True
        })
        
        if active_config:
            raise ValueError(f"An active configuration with the same key and value already exists (ID: {active_config['id']})")
        
        # If this config is active, deactivate all other configs with the same key
        if config.active:
            await self.collection.update_many(
                {"key": config.key, "active": True},
                {"$set": {"active": False, "updated_at": now, "updated_by": username}}
            )
        
        new_config = {
            "id": str(ObjectId()),
            **config_dict,
            "created_at": now,
            "updated_at": now,
            "updated_by": username,
        }

        await self.collection.insert_one(new_config)
        return SiteConfigInDB(**new_config)

    async def update_site_config(self, config_id: str, config_update: SiteConfigUpdate, 
                                username: str) -> Optional[SiteConfigInDB]:
        """Update a site configuration"""
        config = await self.get_site_config_by_id(config_id)
        if not config:
            return None
            
        now = datetime.utcnow()
        update_dict = config_update.model_dump(exclude_unset=True)
        
        if not update_dict:
            return config
            
        # If we're activating this config, deactivate all others with the same key
        if update_dict.get("active"):
            await self.collection.update_many(
                {"key": config.key, "id": {"$ne": config_id}, "active": True},
                {"$set": {"active": False, "updated_at": now, "updated_by": username}}
            )
        
        update_dict["updated_at"] = now
        update_dict["updated_by"] = username

        result = await self.collection.find_one_and_update(
            {"id": config_id},
            {"$set": update_dict},
            return_document=True,
        )

        if result:
            return SiteConfigInDB(**result)
        return None

    async def delete_site_config(self, config_id: str) -> bool:
        """Delete a site configuration"""
        result = await self.collection.delete_one({"id": config_id})
        return result.deleted_count > 0

    async def reset_site_configs(self, username: str) -> bool:
        """Reset all site configurations (not implemented yet)"""
        raise NotImplementedError("Reset functionality is not implemented yet")
