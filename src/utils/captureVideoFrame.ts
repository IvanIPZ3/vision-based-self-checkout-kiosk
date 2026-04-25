export const captureVideoFrame = async (videoElement: HTMLVideoElement): Promise<Blob> => {
  if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    throw new Error('Camera preview is not ready yet.');
  }

  if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    throw new Error('Camera stream has no visible frame.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to capture the current video frame.');
  }

  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable to convert the captured frame to an image.'));
          return;
        }

        resolve(blob);
      },
      'image/jpeg',
      0.92,
    );
  });
};
