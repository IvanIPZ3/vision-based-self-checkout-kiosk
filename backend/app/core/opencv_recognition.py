from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from math import ceil

import cv2
import numpy as np

from backend.app.repositories.reference_images_repository import ReferenceImageRecord


@dataclass(frozen=True)
class OpenCVMatchCandidate:
    reference_image_id: int
    object_id: int
    label: str
    view_group: str | None
    name: str
    price: float
    quantity: int
    confidence: float
    reference_keypoints: int
    good_matches: int
    inliers: int
    inlier_ratio: float
    area_ratio: float
    geometry_valid: bool


@dataclass(frozen=True)
class OpenCVRecognitionResult:
    detected_items: list[OpenCVMatchCandidate]
    unresolved_count: int
    message: str


class OpenCVRecognitionEngine:
    algorithm_name = "opencv-orb-feature-matching"
    algorithm_version = "1.0.0"

    def __init__(self) -> None:
        self._orb = cv2.ORB_create(
            nfeatures=1500,
            scaleFactor=1.2,
            nlevels=8,
            edgeThreshold=15,
            patchSize=31,
            fastThreshold=10,
        )
        self._matcher = cv2.BFMatcher(cv2.NORM_HAMMING)
        self._ratio_threshold = 0.75
        self._min_scene_keypoints = 24
        self._min_reference_keypoints = 18
        self._min_good_matches_for_review = 10
        self._min_good_matches_for_detection = 18
        self._min_inliers_for_detection = 12
        self._min_inlier_ratio_for_detection = 0.52
        self._min_confidence_for_detection = 0.5
        self._min_area_ratio_for_detection = 0.03
        self._max_area_ratio_for_detection = 0.9
        self._reference_crop_ratio = 0.1

    def recognize(
        self,
        *,
        image_bytes: bytes,
        reference_images: list[ReferenceImageRecord],
    ) -> OpenCVRecognitionResult:
        if not reference_images:
            return OpenCVRecognitionResult(
                detected_items=[],
                unresolved_count=0,
                message=(
                    "Еталонні зображення не налаштовані. "
                    "Додайте файли в backend/reference_images та виконайте sync."
                ),
            )

        scene_image = self._decode_grayscale(image_bytes)
        if scene_image is None:
            return OpenCVRecognitionResult(
                detected_items=[],
                unresolved_count=0,
                message="Не вдалося декодувати зображення для OpenCV-обробки.",
            )

        scene_keypoints, scene_descriptors = self._orb.detectAndCompute(scene_image, None)
        if scene_descriptors is None or len(scene_keypoints) < self._min_scene_keypoints:
            return OpenCVRecognitionResult(
                detected_items=[],
                unresolved_count=0,
                message="На кадрі недостатньо візуальних ознак для впевненого розпізнавання.",
            )

        all_candidates_by_group: dict[tuple[str, str | None], list[OpenCVMatchCandidate]] = defaultdict(list)
        total_references_by_group: dict[tuple[str, str | None], int] = defaultdict(int)
        label_order: dict[str, list[str | None]] = defaultdict(list)

        for reference_image in reference_images:
            group_key = (reference_image.label, reference_image.view_group)
            total_references_by_group[group_key] += 1
            if reference_image.view_group not in label_order[reference_image.label]:
                label_order[reference_image.label].append(reference_image.view_group)

            candidate = self._match_reference(
                reference_image=reference_image,
                scene_keypoints=scene_keypoints,
                scene_descriptors=scene_descriptors,
                scene_shape=scene_image.shape,
            )
            if candidate is None:
                continue

            all_candidates_by_group[group_key].append(candidate)

        detected_items: list[OpenCVMatchCandidate] = []
        unresolved_count = 0

        for label, view_groups in label_order.items():
            detected_group_candidates: list[OpenCVMatchCandidate] = []
            has_reviewable_group = False

            for view_group in view_groups:
                group_key = (label, view_group)
                candidates = all_candidates_by_group.get(group_key, [])
                if not candidates:
                    continue

                detection_candidates = [candidate for candidate in candidates if self._is_detection(candidate)]
                review_candidates = [candidate for candidate in candidates if self._is_review_candidate(candidate)]
                best_candidate = max(candidates, key=self._candidate_sort_key)

                if detection_candidates and self._has_enough_support(
                    detection_candidates=detection_candidates,
                    total_references=total_references_by_group[group_key],
                ):
                    detected_group_candidates.append(max(detection_candidates, key=self._candidate_sort_key))
                    continue

                if review_candidates or detection_candidates:
                    has_reviewable_group = True
                    continue

                if best_candidate.good_matches >= self._min_good_matches_for_review:
                    has_reviewable_group = True

            if detected_group_candidates:
                detected_items.append(max(detected_group_candidates, key=self._candidate_sort_key))
            elif has_reviewable_group:
                unresolved_count += 1

        detected_items.sort(
            key=lambda candidate: (-candidate.confidence, -candidate.inliers, candidate.label),
        )

        if detected_items and unresolved_count > 0:
            message = "Частину товарів вдалося знайти, але деякі позиції потребують повторного сканування."
        elif detected_items:
            message = "OpenCV-розпізнавання знайшло товари на платформі."
        elif unresolved_count > 0:
            message = "Є слабкі збіги, але їх недостатньо для впевненого розпізнавання."
        else:
            message = "OpenCV не знайшов збігів із еталонними зображеннями."

        return OpenCVRecognitionResult(
            detected_items=detected_items,
            unresolved_count=unresolved_count,
            message=message,
        )

    def _match_reference(
        self,
        *,
        reference_image: ReferenceImageRecord,
        scene_keypoints: list[cv2.KeyPoint],
        scene_descriptors: np.ndarray,
        scene_shape: tuple[int, ...],
    ) -> OpenCVMatchCandidate | None:
        reference_matrix = cv2.imread(str(reference_image.absolute_path), cv2.IMREAD_GRAYSCALE)
        if reference_matrix is None:
            return None
        reference_matrix = self._crop_reference_focus(reference_matrix)
        best_candidate: OpenCVMatchCandidate | None = None

        for rotation_degrees, rotated_reference in self._generate_reference_variants(reference_matrix):
            reference_keypoints, reference_descriptors = self._orb.detectAndCompute(rotated_reference, None)
            if reference_descriptors is None or len(reference_keypoints) < self._min_reference_keypoints:
                continue

            knn_matches = self._matcher.knnMatch(reference_descriptors, scene_descriptors, k=2)
            good_matches = []

            for pair in knn_matches:
                if len(pair) < 2:
                    continue

                first_match, second_match = pair
                if first_match.distance < self._ratio_threshold * second_match.distance:
                    good_matches.append(first_match)

            good_matches_count = len(good_matches)
            if good_matches_count == 0:
                continue

            inliers = 0
            inlier_ratio = 0.0
            area_ratio = 0.0
            geometry_valid = False
            if good_matches_count >= 4:
                reference_points = np.float32(
                    [reference_keypoints[match.queryIdx].pt for match in good_matches]
                ).reshape(-1, 1, 2)
                scene_points = np.float32(
                    [scene_keypoints[match.trainIdx].pt for match in good_matches]
                ).reshape(-1, 1, 2)
                homography, mask = cv2.findHomography(reference_points, scene_points, cv2.RANSAC, 5.0)
                if mask is not None:
                    inliers = int(mask.ravel().sum())
                    inlier_ratio = inliers / good_matches_count if good_matches_count else 0.0

                if homography is not None:
                    area_ratio, geometry_valid = self._evaluate_projected_area(
                        homography=homography,
                        reference_shape=rotated_reference.shape,
                        scene_shape=scene_shape,
                    )

            confidence = self._calculate_confidence(
                good_matches=good_matches_count,
                inliers=inliers,
                inlier_ratio=inlier_ratio,
                geometry_valid=geometry_valid,
            )

            candidate = OpenCVMatchCandidate(
                reference_image_id=reference_image.id,
                object_id=reference_image.object_id,
                label=reference_image.label,
                view_group=reference_image.view_group,
                name=reference_image.name,
                price=reference_image.price,
                quantity=1,
                confidence=confidence,
                reference_keypoints=len(reference_keypoints),
                good_matches=good_matches_count,
                inliers=inliers,
                inlier_ratio=round(inlier_ratio, 2),
                area_ratio=round(area_ratio, 4),
                geometry_valid=geometry_valid,
            )

            if best_candidate is None or self._candidate_sort_key(candidate) > self._candidate_sort_key(best_candidate):
                best_candidate = candidate

        return best_candidate

    def _calculate_confidence(
        self,
        *,
        good_matches: int,
        inliers: int,
        inlier_ratio: float,
        geometry_valid: bool,
    ) -> float:
        good_match_component = min(good_matches / 55.0, 1.0)
        inlier_component = min(inliers / 30.0, 1.0)
        inlier_ratio_component = min(inlier_ratio / 0.75, 1.0)
        geometry_component = 1.0 if geometry_valid else 0.0
        confidence = (
            (good_match_component * 0.25)
            + (inlier_component * 0.35)
            + (inlier_ratio_component * 0.25)
            + (geometry_component * 0.15)
        )
        return round(confidence, 2)

    def _candidate_sort_key(self, candidate: OpenCVMatchCandidate) -> tuple[float, int, float, int]:
        return (candidate.confidence, candidate.inliers, candidate.inlier_ratio, candidate.good_matches)

    def _is_detection(self, candidate: OpenCVMatchCandidate) -> bool:
        return (
            candidate.good_matches >= self._min_good_matches_for_detection
            and candidate.inliers >= self._min_inliers_for_detection
            and candidate.inlier_ratio >= self._min_inlier_ratio_for_detection
            and candidate.confidence >= self._min_confidence_for_detection
            and candidate.geometry_valid
            and self._min_area_ratio_for_detection <= candidate.area_ratio <= self._max_area_ratio_for_detection
        )

    def _is_review_candidate(self, candidate: OpenCVMatchCandidate) -> bool:
        return (
            candidate.good_matches >= self._min_good_matches_for_review
            and candidate.inliers >= 6
            and candidate.inlier_ratio >= 0.35
        )

    def _has_enough_support(
        self,
        *,
        detection_candidates: list[OpenCVMatchCandidate],
        total_references: int,
    ) -> bool:
        required_support = 1
        if total_references >= 3:
            required_support = 2
        if total_references >= 8:
            required_support = max(required_support, ceil(total_references * 0.25))

        unique_reference_count = len({candidate.reference_image_id for candidate in detection_candidates})
        if unique_reference_count >= required_support:
            return True

        best_candidate = max(detection_candidates, key=self._candidate_sort_key)
        return (
            best_candidate.confidence >= 0.9
            and best_candidate.inliers >= 26
            and best_candidate.inlier_ratio >= 0.72
        )

    def _decode_grayscale(self, image_bytes: bytes) -> np.ndarray | None:
        byte_array = np.frombuffer(image_bytes, dtype=np.uint8)
        return cv2.imdecode(byte_array, cv2.IMREAD_GRAYSCALE)

    def _crop_reference_focus(self, reference_matrix: np.ndarray) -> np.ndarray:
        height, width = reference_matrix.shape[:2]
        x_margin = max(int(width * self._reference_crop_ratio), 1)
        y_margin = max(int(height * self._reference_crop_ratio), 1)

        if width <= (x_margin * 2) + 20 or height <= (y_margin * 2) + 20:
            return reference_matrix

        return reference_matrix[y_margin : height - y_margin, x_margin : width - x_margin]

    def _generate_reference_variants(
        self,
        reference_matrix: np.ndarray,
    ) -> list[tuple[int, np.ndarray]]:
        return [
            (0, reference_matrix),
            (180, cv2.rotate(reference_matrix, cv2.ROTATE_180)),
        ]

    def _evaluate_projected_area(
        self,
        *,
        homography: np.ndarray,
        reference_shape: tuple[int, ...],
        scene_shape: tuple[int, ...],
    ) -> tuple[float, bool]:
        reference_height, reference_width = reference_shape[:2]
        scene_height, scene_width = scene_shape[:2]

        reference_corners = np.float32(
            [
                [0, 0],
                [reference_width - 1, 0],
                [reference_width - 1, reference_height - 1],
                [0, reference_height - 1],
            ]
        ).reshape(-1, 1, 2)
        projected_corners = cv2.perspectiveTransform(reference_corners, homography)
        polygon = projected_corners.reshape(-1, 2)

        if not cv2.isContourConvex(polygon.astype(np.float32)):
            return 0.0, False

        polygon_area = abs(cv2.contourArea(polygon.astype(np.float32)))
        scene_area = float(scene_width * scene_height)
        if scene_area <= 0:
            return 0.0, False

        area_ratio = polygon_area / scene_area
        if area_ratio <= 0:
            return area_ratio, False

        min_x = float(np.min(polygon[:, 0]))
        max_x = float(np.max(polygon[:, 0]))
        min_y = float(np.min(polygon[:, 1]))
        max_y = float(np.max(polygon[:, 1]))

        x_tolerance = scene_width * 0.1
        y_tolerance = scene_height * 0.1
        within_scene = (
            min_x >= -x_tolerance
            and max_x <= scene_width + x_tolerance
            and min_y >= -y_tolerance
            and max_y <= scene_height + y_tolerance
        )

        return area_ratio, within_scene


opencv_recognition_engine = OpenCVRecognitionEngine()
