import type { PredictionResponse } from '../types';

const predictionEndpoint = '/api/inference/predict';

export const sendFrameForPrediction = async (imageBlob: Blob): Promise<PredictionResponse> => {
  const formData = new FormData();
  formData.append('image', imageBlob, 'checkout-frame.jpg');

  const response = await fetch(predictionEndpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Backend request failed.';

    try {
      const errorPayload = (await response.json()) as { detail?: string };
      if (errorPayload.detail) {
        errorMessage = errorPayload.detail;
      }
    } catch {
      // Ignore JSON parsing failures and keep the generic message.
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as PredictionResponse;
};
