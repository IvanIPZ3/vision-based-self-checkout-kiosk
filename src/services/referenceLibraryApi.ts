import { buildApiUrl } from '../config/api';
import type { ReferenceCaptureResponse, ReferenceObject } from '../types';

const objectsPath = '/api/reference-library/objects';
const capturePath = '/api/reference-library/capture';

const extractApiError = async (response: Response, fallbackMessage: string) => {
  let errorMessage = fallbackMessage;

  try {
    const errorPayload = (await response.json()) as { detail?: string };
    if (errorPayload.detail) {
      errorMessage = errorPayload.detail;
    }
  } catch {
    // Keep the fallback message when the payload is not JSON.
  }

  return errorMessage;
};

export const fetchReferenceObjects = async (): Promise<ReferenceObject[]> => {
  const response = await fetch(buildApiUrl(objectsPath));

  if (!response.ok) {
    throw new Error(await extractApiError(response, 'Не вдалося завантажити каталог еталонів.'));
  }

  const payload = (await response.json()) as { items: ReferenceObject[] };
  return payload.items;
};

export const saveReferenceCapture = async (
  objectLabel: string,
  viewGroup: 'front' | 'back',
  imageBlob: Blob,
): Promise<ReferenceCaptureResponse> => {
  const formData = new FormData();
  formData.append('objectLabel', objectLabel);
  formData.append('viewGroup', viewGroup);
  formData.append('image', imageBlob, 'reference-capture.jpg');

  const response = await fetch(buildApiUrl(capturePath), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await extractApiError(response, 'Не вдалося зберегти еталонне зображення.'));
  }

  return (await response.json()) as ReferenceCaptureResponse;
};
