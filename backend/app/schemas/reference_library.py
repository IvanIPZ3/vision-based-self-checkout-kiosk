from typing import Literal

from pydantic import BaseModel, Field


class ReferenceObjectItem(BaseModel):
    id: int
    label: str
    name: str
    priceMinor: int
    price: float
    description: str | None = None
    catalogSource: str


class ReferenceObjectsResponse(BaseModel):
    items: list[ReferenceObjectItem] = Field(default_factory=list)


class ReferenceObjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=180)
    priceMinor: int = Field(..., ge=0)
    description: str | None = Field(default=None, max_length=2000)


class ReferenceObjectCreateResponse(BaseModel):
    item: ReferenceObjectItem
    message: str


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
