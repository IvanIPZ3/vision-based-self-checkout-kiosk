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

  const viewportWidth = videoElement.clientWidth;
  const viewportHeight = videoElement.clientHeight;
  const objectFit = window.getComputedStyle(videoElement).objectFit;

  // Match the captured image to the visible kiosk preview instead of the full raw frame.
  if (objectFit === 'contain') {
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  } else if (viewportWidth > 0 && viewportHeight > 0) {
    const sourceWidth = videoElement.videoWidth;
    const sourceHeight = videoElement.videoHeight;
    const coverScale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
    const visibleSourceWidth = viewportWidth / coverScale;
    const visibleSourceHeight = viewportHeight / coverScale;
    const sourceX = Math.max((sourceWidth - visibleSourceWidth) / 2, 0);
    const sourceY = Math.max((sourceHeight - visibleSourceHeight) / 2, 0);

    canvas.width = Math.round(visibleSourceWidth);
    canvas.height = Math.round(visibleSourceHeight);

    context.drawImage(
      videoElement,
      sourceX,
      sourceY,
      visibleSourceWidth,
      visibleSourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  } else {
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  }

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
