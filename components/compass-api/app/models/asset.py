from datetime import datetime
from typing import Annotated, Optional

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field, GetJsonSchemaHandler
from pydantic_core import CoreSchema, core_schema


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        _source_type: type[ObjectId] | None = None,
        _handler: GetJsonSchemaHandler | None = None,
    ) -> CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema(
                [
                    core_schema.is_instance_schema(ObjectId),
                    core_schema.no_info_plain_validator_function(lambda x: ObjectId(x) if isinstance(x, str) else x),
                ]
            ),
            serialization=core_schema.plain_serializer_function_ser_schema(lambda x: str(x)),
        )


class AssetBase(BaseModel):
    name: str
    mimeType: str
    size: int
    url: str

    model_config = ConfigDict(populate_by_name=True)


class AssetCreate(AssetBase):
    pass


class Asset(AssetBase):
    id: Annotated[PyObjectId, Field(alias="_id", serialization_alias="_id")]
    createdAt: datetime
    updatedAt: datetime


class AssetInDB(Asset):
    data: Optional[bytes] = None
    gridFSId: Optional[PyObjectId] = None
