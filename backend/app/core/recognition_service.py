from io import BytesIO

from PIL import Image, UnidentifiedImageError

from backend.app.core.opencv_recognition import opencv_recognition_engine
from backend.app.repositories.objects_repository import objects_repository
from backend.app.repositories.reference_images_repository import reference_images_repository
from backend.app.repositories.recognition_runs_repository import (
    RecognitionRunItemPayload,
    RecognitionRunPayload,
    recognition_runs_repository,
)
from backend.app.schemas.prediction import (
    PredictionDebugInfo,
    PredictionItem,
    PredictionResponse,
)


class ImageValidationError(ValueError):
    """Raised when the uploaded payload cannot be treated as an image."""


class RecognitionService:
    algorithm_name = opencv_recognition_engine.algorithm_name
    algorithm_version = opencv_recognition_engine.algorithm_version

    def predict(
        self,
        *,
        image_bytes: bytes,
        filename: str | None,
        content_type: str | None,
    ) -> PredictionResponse:
        image_info = self._read_image_info(image_bytes)
        reference_images = reference_images_repository.list_active()
        recognition_result = opencv_recognition_engine.recognize(
            image_bytes=image_bytes,
            reference_images=reference_images,
        )

        requested_labels = list(
            {
                item.label
                for item in [*recognition_result.detected_items, *recognition_result.uncertain_items]
            }
        )
        objects_by_label = objects_repository.get_active_by_labels(requested_labels)

        prediction_items: list[PredictionItem] = []
        uncertain_prediction_items: list[PredictionItem] = []
        run_items: list[RecognitionRunItemPayload] = []

        for item in recognition_result.detected_items:
          catalog_object = objects_by_label.get(item.label)
          if catalog_object is None:
              continue

          prediction_items.append(
              PredictionItem(
                  objectId=catalog_object.id,
                  label=catalog_object.label,
                  name=catalog_object.name,
                  price=catalog_object.price,
                  quantity=item.quantity,
                  confidence=item.confidence,
              )
          )
          run_items.append(
              RecognitionRunItemPayload(
                  object_id=catalog_object.id,
                  predicted_label=catalog_object.label,
                  quantity=item.quantity,
                  confidence=item.confidence,
                  good_matches=item.good_matches,
                  inliers=item.inliers,
              )
          )

        for item in recognition_result.uncertain_items:
            catalog_object = objects_by_label.get(item.label)
            if catalog_object is None:
                continue

            uncertain_prediction_items.append(
                PredictionItem(
                    objectId=catalog_object.id,
                    label=catalog_object.label,
                    name=catalog_object.name,
                    price=catalog_object.price,
                    quantity=item.quantity,
                    confidence=item.confidence,
                )
            )

        unresolved_count = recognition_result.unresolved_count
        primary_item = prediction_items[0] if prediction_items else None
        primary_uncertain_item = uncertain_prediction_items[0] if uncertain_prediction_items else None

        run_id = recognition_runs_repository.create_run(
            run=RecognitionRunPayload(
                request_filename=filename,
                request_content_type=content_type,
                image_width=image_info["width"],
                image_height=image_info["height"],
                image_format=image_info["imageFormat"],
                detected_any=bool(prediction_items),
                unresolved_count=unresolved_count,
                message=recognition_result.message,
                algorithm_name=self.algorithm_name,
                algorithm_version=self.algorithm_version,
            ),
            items=run_items,
        )

        return PredictionResponse(
            detected=bool(prediction_items),
            label=primary_item.label if primary_item else (primary_uncertain_item.label if primary_uncertain_item else None),
            confidence=primary_item.confidence if primary_item else 0.0,
            message=recognition_result.message,
            items=prediction_items,
            uncertainItems=uncertain_prediction_items,
            unresolvedCount=unresolved_count,
            debug=PredictionDebugInfo(
                runId=run_id,
                filename=filename,
                contentType=content_type,
                sizeBytes=len(image_bytes),
                width=image_info["width"],
                height=image_info["height"],
                imageFormat=image_info["imageFormat"],
                algorithmName=self.algorithm_name,
                algorithmVersion=self.algorithm_version,
            ),
        )

    def _read_image_info(self, image_bytes: bytes) -> dict[str, int | str | None]:
        try:
            with Image.open(BytesIO(image_bytes)) as image:
                width, height = image.size
                image_format = image.format
        except UnidentifiedImageError as error:
            raise ImageValidationError("Завантажений файл не є коректним зображенням.") from error
        except OSError as error:
            raise ImageValidationError("Не вдалося декодувати зображення.") from error

        return {
            "width": width,
            "height": height,
            "imageFormat": image_format,
        }


recognition_service = RecognitionService()
