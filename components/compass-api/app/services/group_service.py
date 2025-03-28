from datetime import datetime
from typing import Optional

from bson import ObjectId
from cachetools import TTLCache, keys

from app.core.database import get_database
from app.models.group import Group, GroupCreate, GroupInDB, GroupUpdate


class GroupService:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.groups
        # Create a cache with 1-hour TTL
        self.groups_cache = TTLCache(maxsize=1, ttl=3600)

    async def create_group(self, group: GroupCreate, username: Optional[str] = None) -> GroupInDB:
        """Create a new group"""
        # Name is already trimmed by the model validator
        name = group.name

        # Check if group already exists (exact match)
        existing_group = await self.get_group_by_name(name)
        if existing_group:
            raise ValueError(f"Group '{name}' already exists")

        group_dict = group.model_dump()
        group_dict["created_at"] = datetime.utcnow()
        group_dict["updated_at"] = datetime.utcnow()
        if username:
            group_dict["created_by"] = username
            group_dict["updated_by"] = username

        result = await self.collection.insert_one(group_dict)
        # Clear cache since data has been updated
        self.groups_cache.clear()
        return await self.get_group_by_id(str(result.inserted_id))

    async def get_group_by_id(self, group_id: str) -> Optional[Group]:
        """Get a group by ID with usage count"""
        group = await self.collection.find_one({"_id": ObjectId(group_id)})
        if group:
            group_in_db = GroupInDB(**group)
            return await self.get_group_with_usage(group_in_db)
        return None

    async def get_group_by_name(self, name: str) -> Optional[GroupInDB]:
        """Get a group by name (exact match)"""
        # Name is already trimmed by the model validator
        group = await self.collection.find_one({"name": name})
        if group:
            return GroupInDB(**group)
        return None

    async def get_groups(self, skip: int = 0, limit: int = 100, sort: str = "order") -> list[Group]:
        """Get all groups with pagination and sorting

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            sort: Sort field (prefix with - for descending order, default is 'order')
        """
        # Generate cache key
        cache_key = keys.hashkey(skip, limit, sort)

        # Try to get data from cache
        if cache_key in self.groups_cache:
            return self.groups_cache[cache_key]

        # Parse sort parameter
        sort_field = sort.lstrip("-")
        sort_direction = -1 if sort.startswith("-") else 1

        # Build sort query
        sort_query = [(sort_field, sort_direction)]

        cursor = self.collection.find().sort(sort_query).skip(skip).limit(limit)
        groups = await cursor.to_list(length=limit)
        groups_in_db = [GroupInDB(**group) for group in groups]
        
        # Convert to Group with usage count
        result = [await self.get_group_with_usage(group) for group in groups_in_db]

        # Store result in cache
        self.groups_cache[cache_key] = result
        return result

    async def update_group_by_id(
        self,
        group_id: str,
        group_update: GroupUpdate,
        username: Optional[str] = None,
    ) -> Optional[GroupInDB]:
        """Update a group by ID"""
        # Get existing group
        existing_group = await self.get_group_by_id(group_id)
        if not existing_group:
            return None

        update_dict = group_update.model_dump(exclude_unset=True)

        # Check name uniqueness if being updated
        if "name" in update_dict and update_dict["name"] != existing_group.name:
            other_group = await self.get_group_by_name(update_dict["name"])
            if other_group and str(other_group.id) != group_id:
                raise ValueError(f"Group '{update_dict['name']}' is already in use")

            # Update all solutions using this group
            await self.db.solutions.update_many(
                {"group": existing_group.name},
                {
                    "$set": {
                        "group": update_dict["name"],
                        "updated_at": datetime.utcnow(),
                        "updated_by": username if username else None,
                    }
                },
            )

        update_dict["updated_at"] = datetime.utcnow()
        if username:
            update_dict["updated_by"] = username

        result = await self.collection.update_one({"_id": ObjectId(group_id)}, {"$set": update_dict})
        # Clear cache since data has been updated
        self.groups_cache.clear()
        if result.modified_count:
            return await self.get_group_by_id(group_id)
        return existing_group

    async def delete_group_by_id(self, group_id: str) -> bool:
        """Delete a group by ID"""
        # Get group first
        group = await self.get_group_by_id(group_id)
        if not group:
            return False

        # Check if group is being used by any solutions
        solutions_using_group = await self.db.solutions.find_one({"group": group.name})
        if solutions_using_group:
            raise ValueError(f"Cannot delete group '{group.name}' as it is being used by solutions")

        result = await self.collection.delete_one({"_id": ObjectId(group_id)})
        # Clear cache since data has been updated
        self.groups_cache.clear()
        return result.deleted_count > 0

    async def count_groups(self) -> int:
        """Get total number of groups"""
        return await self.collection.count_documents({})

    async def get_group_usage_count(self, name: str) -> int:
        """Get the number of solutions using this group"""
        return await self.db.solutions.count_documents({"group": name})

    async def get_group_with_usage(self, group: GroupInDB) -> Group:
        """Convert GroupInDB to Group with usage count"""
        group_dict = group.model_dump()
        usage_count = await self.get_group_usage_count(group.name)
        return Group(**group_dict, usage_count=usage_count)
        
    async def get_or_create_group(self, name: str, username: Optional[str] = None) -> GroupInDB:
        """Get a group by name or create it if it doesn't exist
        
        Args:
            name: The group name to get or create
            username: The username performing the operation
            
        Returns:
            The existing or newly created group
        """
        # Trim the name first
        name = name.strip()
        
        # Check if group already exists (exact match)
        existing_group = await self.get_group_by_name(name)
        if existing_group:
            return existing_group
            
        # Create new group if it doesn't exist
        from app.models.group import GroupCreate
        
        group_create = GroupCreate(name=name, description=f"Group for {name}")
        return await self.create_group(group_create, username)