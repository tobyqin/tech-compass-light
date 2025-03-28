from pydantic import BaseModel, Field, field_validator

from app.models.common import AuditModel


class GroupBase(BaseModel):
    """Base group model with common fields"""

    name: str = Field(
        ...,
        description="Group name (spaces will be trimmed)",
        min_length=1,
        max_length=100,
        examples=["Frontend", "Backend", "DevOps"],
    )
    description: str = Field("", description="Group description", max_length=500)
    order: int = Field(0, description="Order for sorting groups (lower values appear first)")

    @field_validator("name")
    @classmethod
    def validate_name(cls, name: str) -> str:
        """Validate and transform group name"""
        # Trim spaces
        name = name.strip()
        # Check if empty after trimming
        if not name:
            raise ValueError("Group name cannot be empty")
        return name

    @field_validator("description")
    @classmethod
    def validate_description(cls, description: str) -> str:
        """Validate group description"""
        return description.strip() if description else ""


class GroupCreate(GroupBase):
    """Group creation model"""

    pass


class GroupUpdate(GroupBase):
    """Group update model"""

    pass


class GroupInDB(GroupBase, AuditModel):
    """Group model as stored in database"""

    pass


class Group(GroupInDB):
    """Group model for API responses"""

    usage_count: int = Field(default=0, description="Number of solutions in this group")