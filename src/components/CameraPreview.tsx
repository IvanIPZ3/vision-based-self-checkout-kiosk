import { useEffect, type RefObject, useState } from 'react';

type CameraState = 'loading' | 'ready' | 'unsupported' | 'denied' | 'error';

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
}

const cameraMessageMap: Record<Exclude<CameraState, 'ready'>, { title: string; detail: string }> = {
  loading: {
    title: 'Підключення до камери',
    detail: 'Зачекайте, система активує відеопотік над платформою.',
  },
  unsupported: {
    title: 'Камеру не знайдено',
    detail: 'Перевірте підключення камери або відкрийте застосунок на пристрої з камерою.',
  },
  denied: {
    title: 'Немає доступу до камери',
    detail: 'Дозвольте доступ до камери у браузері, щоб бачити платформу наживо.',
  },
  error: {
    title: 'Не вдалося відкрити камеру',
    detail: 'Оновіть сторінку або перевірте, чи камера не зайнята іншою програмою.',
  },
};

export const CameraPreview = ({ videoRef }: CameraPreviewProps) => {
  const [cameraState, setCameraState] = useState<CameraState>('loading');

  useEffect(() => {
    let isCancelled = false;
    const videoElement = videoRef.current;
    let mediaStream: MediaStream | null = null;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('unsupported');
        return;
      }

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (isCancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoElement) {
          videoElement.srcObject = mediaStream;
          await videoElement.play().catch(() => undefined);
        }

        setCameraState('ready');
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (error instanceof DOMException) {
          if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
            setCameraState('denied');
            return;
          }

          if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            setCameraState('unsupported');
            return;
          }
        }

        setCameraState('error');
      }
    };

    startCamera();

    return () => {
      isCancelled = true;

      if (videoElement) {
        videoElement.srcObject = null;
      }

      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoRef]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`camera-video ${cameraState === 'ready' ? 'opacity-100' : 'opacity-0'}`}
      />
      {cameraState !== 'ready' && (
        <div className="camera-fallback">
          <div className="camera-fallback-card">
            <p className="text-2xl font-display font-bold text-slate-100">{cameraMessageMap[cameraState].title}</p>
            <p className="mt-3 max-w-xl text-lg font-semibold text-slate-300">{cameraMessageMap[cameraState].detail}</p>
          </div>
        </div>
      )}
    </>
  );
};
