from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class Asset(BaseModel):
    id: str = Field(alias="_id")
    name: str
    mimeType: str
    size: int
    gridFSId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


class AssetInDB(BaseModel):
    id: str = Field(alias="_id")
    name: str
    mimeType: str
    size: int
    gridFSId: Optional[str] = None
    data: Optional[bytes] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
