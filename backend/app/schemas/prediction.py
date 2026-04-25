from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["ok"])


class PredictionItem(BaseModel):
    label: str
    quantity: int = 1
    confidence: float = Field(..., ge=0.0, le=1.0)


class PredictionDebugInfo(BaseModel):
    filename: str | None = None
    contentType: str | None = None
    sizeBytes: int
    width: int | None = None
    height: int | None = None
    imageFormat: str | None = None


class PredictionResponse(BaseModel):
    detected: bool
    label: str | None = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    message: str
    items: list[PredictionItem] = Field(default_factory=list)
    unresolvedCount: int = 0
    debug: PredictionDebugInfo | None = None
