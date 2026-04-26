from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["ok"])


class PredictionItem(BaseModel):
    objectId: int
    label: str
    name: str
    price: float = Field(..., ge=0.0)
    quantity: int = 1
    confidence: float = Field(..., ge=0.0, le=1.0)


class PredictionDebugInfo(BaseModel):
    runId: int | None = None
    filename: str | None = None
    contentType: str | None = None
    sizeBytes: int
    width: int | None = None
    height: int | None = None
    imageFormat: str | None = None
    algorithmName: str | None = None
    algorithmVersion: str | None = None


class PredictionResponse(BaseModel):
    detected: bool
    label: str | None = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    message: str
    items: list[PredictionItem] = Field(default_factory=list)
    unresolvedCount: int = 0
    debug: PredictionDebugInfo | None = None
