from typing import Optional

from app.models.common import AuditModel
from pydantic import BaseModel, Field


class AssetBase(BaseModel):
    """Base asset model with common fields"""

    name: str = Field(..., description="Asset name", min_length=1, max_length=255)
    mime_type: str = Field(..., description="MIME type of the asset")


class AssetCreate(AssetBase):
    """Asset creation model"""

    data: Optional[bytes] = Field(None, description="Binary data of the asset")


class AssetUpdate(AssetBase):
    """Asset update model"""

    data: Optional[bytes] = Field(None, description="Binary data of the asset")


class AssetInDB(AssetBase, AuditModel):
    """Asset model as stored in database"""

    data: Optional[bytes] = Field(None, description="Binary data of the asset")


class Asset(AssetBase, AuditModel):
    """Asset model for API responses"""

    pass
