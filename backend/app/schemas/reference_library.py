from typing import Literal

from pydantic import BaseModel, Field


class ReferenceObjectItem(BaseModel):
    id: int
    label: str
    name: str


class ReferenceObjectsResponse(BaseModel):
    items: list[ReferenceObjectItem] = Field(default_factory=list)


class ReferenceCaptureResponse(BaseModel):
    objectLabel: str
    objectName: str
    viewGroup: Literal["front", "back"]
    savedPath: str
    filename: str
    width: int
    height: int
    imageFormat: str
    syncActive: int = Field(..., ge=0)
    message: str
