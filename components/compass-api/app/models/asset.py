from typing import Optional

from app.models.common import AuditModel
from pydantic import BaseModel, Field


class AssetBase(BaseModel):
    """Base asset model with common fields"""

    name: str = Field(..., description="Asset name", min_length=1, max_length=255)
    mime_type: str = Field(..., description="MIME type of the asset", alias="mimeType")
    data: Optional[bytes] = Field(None, description="Binary data of the asset")


class AssetCreate(AssetBase):
    """Asset creation model"""

    pass


class AssetUpdate(AssetBase):
    """Asset update model"""

    pass


class AssetInDB(AssetBase, AuditModel):
    """Asset model as stored in database"""

    pass


class Asset(AssetInDB):
    """Asset model for API responses"""

    pass
