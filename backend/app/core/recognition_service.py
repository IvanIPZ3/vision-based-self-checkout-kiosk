from collections.abc import Iterator
from io import BytesIO
from itertools import cycle

from PIL import Image, UnidentifiedImageError

from backend.app.schemas.prediction import (
    PredictionDebugInfo,
    PredictionItem,
    PredictionResponse,
)


class ImageValidationError(ValueError):
    """Raised when the uploaded payload cannot be treated as an image."""


class RecognitionService:
    def __init__(self) -> None:
        self._mock_predictions: Iterator[dict[str, object]] = cycle(
            [
                {
                    "detected": True,
                    "message": "Backend received image successfully",
                    "items": [
                        {"label": "milk", "quantity": 1, "confidence": 0.97},
                        {"label": "bread", "quantity": 1, "confidence": 0.94},
                        {"label": "apples", "quantity": 2, "confidence": 0.91},
                    ],
                    "unresolvedCount": 0,
                },
                {
                    "detected": True,
                    "message": "Backend received image successfully",
                    "items": [
                        {"label": "milk", "quantity": 1, "confidence": 0.93},
                        {"label": "apples", "quantity": 1, "confidence": 0.88},
                    ],
                    "unresolvedCount": 1,
                },
                {
                    "detected": False,
                    "message": "Backend received image successfully",
                    "items": [],
                    "unresolvedCount": 0,
                },
            ]
        )

    def predict(
        self,
        *,
        image_bytes: bytes,
        filename: str | None,
        content_type: str | None,
    ) -> PredictionResponse:
        image_info = self._read_image_info(image_bytes)
        mock_prediction = next(self._mock_predictions)
        prediction_items = [
            PredictionItem(**item) for item in mock_prediction["items"]  # type: ignore[index]
        ]

        primary_item = prediction_items[0] if prediction_items else None

        return PredictionResponse(
            detected=bool(mock_prediction["detected"]),
            label=primary_item.label if primary_item else None,
            confidence=primary_item.confidence if primary_item else 0.0,
            message=str(mock_prediction["message"]),
            items=prediction_items,
            unresolvedCount=int(mock_prediction["unresolvedCount"]),
            debug=PredictionDebugInfo(
                filename=filename,
                contentType=content_type,
                sizeBytes=len(image_bytes),
                width=image_info["width"],
                height=image_info["height"],
                imageFormat=image_info["imageFormat"],
            ),
        )

    def _read_image_info(self, image_bytes: bytes) -> dict[str, int | str | None]:
        try:
            with Image.open(BytesIO(image_bytes)) as image:
                width, height = image.size
                image_format = image.format
        except UnidentifiedImageError as error:
            raise ImageValidationError("Uploaded file is not a valid image.") from error
        except OSError as error:
            raise ImageValidationError("Uploaded image could not be decoded.") from error

        return {
            "width": width,
            "height": height,
            "imageFormat": image_format,
        }


recognition_service = RecognitionService()
