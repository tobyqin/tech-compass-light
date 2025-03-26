from typing import List, Optional, Any, Dict
from datetime import datetime

from pydantic import BaseModel, Field, validator
import json

from app.models import AuditModel


class SiteConfigBase(BaseModel):
    """Base model for site configuration"""
    
    key: str = Field(..., description="Unique key identifying the configuration type (e.g., 'home', 'footer')")
    value: Dict[str, Any] = Field(..., description="Configuration value as JSON")
    active: bool = Field(default=True, description="Whether this configuration is active")
    description: Optional[str] = Field(None, description="Description of this configuration")
    
    @validator('value')
    def validate_json(cls, v):
        """Validate that value is proper JSON"""
        # Test if it can be serialized/deserialized
        try:
            json_str = json.dumps(v)
            json.loads(json_str)
            return v
        except Exception as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")


class SiteConfigCreate(SiteConfigBase):
    """Model for creating a new site configuration"""
    pass


class SiteConfigUpdate(BaseModel):
    """Model for updating site configuration"""
    
    value: Optional[Dict[str, Any]] = None
    active: Optional[bool] = None
    description: Optional[str] = None
    
    @validator('value')
    def validate_json(cls, v):
        if v is None:
            return v
        try:
            json_str = json.dumps(v)
            json.loads(json_str)
            return v
        except Exception as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")


class SiteConfigInDB(SiteConfigBase, AuditModel):
    """Model for site configuration in database"""
    pass


class SiteConfigResponse(SiteConfigInDB):
    """Response model for site configuration"""
    pass
