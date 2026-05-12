import type { RefObject } from 'react';
import { AppButton } from '../components/AppButton';
import { CameraPreview } from '../components/CameraPreview';
import { CartPanel } from '../components/CartPanel';
import { RecognitionStatus } from '../components/RecognitionStatus';
import { formatCurrency } from '../utils/format';
import type {
  CartItem,
  PredictionResponse,
  RecognitionStatus as RecognitionStatusType,
} from '../types';

interface ScanScreenProps {
  recognitionStatus: RecognitionStatusType;
  cartItems: CartItem[];
  selectedItemId: string | null;
  total: number;
  lastPrediction: PredictionResponse | null;
  cameraVideoRef: RefObject<HTMLVideoElement | null>;
  onSelectItem: (id: string) => void;
  onDeleteSelected: () => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onRequestStaff: (reason: 'recognition_error' | 'manual_request') => void;
  onStartScan: () => void;
}

export const ScanScreen = ({
  recognitionStatus,
  cartItems,
  selectedItemId,
  total,
  lastPrediction,
  cameraVideoRef,
  onSelectItem,
  onDeleteSelected,
  onClearCart,
  onCheckout,
  onRequestStaff,
  onStartScan,
}: ScanScreenProps) => {
  const isScanning = recognitionStatus === 'scanning';
  const hasPredictionItems = Boolean(lastPrediction && lastPrediction.items.length > 0);
  const hasUncertainItems = Boolean(lastPrediction && lastPrediction.uncertainItems.length > 0);
  const hasUnresolvedItems = Boolean(lastPrediction && lastPrediction.unresolvedCount > 0);
  const unresolvedMessage = lastPrediction
    ? lastPrediction.unresolvedCount === 1
      ? 'Ще один товар не вдалося розпізнати.'
      : `Ще ${lastPrediction.unresolvedCount} товари не вдалося розпізнати.`
    : '';

  const renderStatusContent = () => {
    if (recognitionStatus === 'waiting' || recognitionStatus === 'empty') {
      return (
        <>
          <div className="space-y-3">
            <div className="platform-tip">
              <span className="platform-tip-index">1</span>
              <p>Покладіть один товар по центру видимої рамки.</p>
            </div>
            <div className="platform-tip">
              <span className="platform-tip-index">2</span>
              <p>Приберіть руки та зайві предмети з платформи.</p>
            </div>
            <div className="platform-tip">
              <span className="platform-tip-index">3</span>
              <p>Натисніть «Сканувати товари», коли товар лежить нерухомо.</p>
            </div>
          </div>
          {recognitionStatus === 'empty' && lastPrediction?.message && (
            <div className="rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-4">
              <p className="text-lg font-semibold text-sky-100">{lastPrediction.message}</p>
            </div>
          )}
        </>
      );
    }

    if (recognitionStatus === 'scanning') {
      return (
        <div className="rounded-2xl border border-kiosk-warning/40 bg-kiosk-warning/10 px-4 py-5">
          <p className="text-xl font-display font-bold text-kiosk-warning">Триває аналіз кадру</p>
          <p className="mt-2 text-base font-semibold text-slate-200">
            Утримуйте товар у межах рамки, поки система завершує перевірку.
          </p>
        </div>
      );
    }

    if ((recognitionStatus === 'success' || recognitionStatus === 'partial') && hasPredictionItems && lastPrediction) {
      return (
        <>
          <div className="space-y-3">
            {lastPrediction.items.map((item) => (
              <div
                key={`${item.label}-${item.quantity}-${item.confidence}`}
                className="platform-result-row"
              >
                <div>
                  <p className="text-xl font-semibold text-slate-100">{item.name}</p>
                  <p className="platform-result-meta">{formatCurrency(item.price)} за одиницю</p>
                </div>
                <div className="platform-result-summary">
                  <p className="platform-result-qty">x{item.quantity}</p>
                  <p className="platform-result-total">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          {hasUncertainItems && (
            <div className="rounded-2xl border border-kiosk-warning/50 bg-kiosk-warning/10 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-kiosk-warning">
                Потребує уточнення
              </p>
              <div className="mt-3 space-y-3">
                {lastPrediction.uncertainItems.map((item) => (
                  <div
                    key={`uncertain-${item.label}-${item.quantity}-${item.confidence}`}
                    className="platform-result-row border-kiosk-warning/40"
                  >
                    <div>
                      <p className="platform-result-tag">Ймовірний товар</p>
                      <p className="text-lg font-semibold text-slate-100">{item.name}</p>
                      <p className="platform-result-meta">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="platform-result-summary">
                      <p className="platform-result-confidence text-kiosk-warning">
                        {Math.round(item.confidence * 100)}%
                      </p>
                      <p className="platform-result-meta">Не додано</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasUnresolvedItems && (
            <div className="rounded-2xl border border-kiosk-warning/40 bg-kiosk-warning/8 px-4 py-4">
              <p className="text-base font-semibold text-kiosk-warning">{unresolvedMessage}</p>
            </div>
          )}
        </>
      );
    }

    if (recognitionStatus === 'uncertain' && hasUncertainItems && lastPrediction) {
      return (
        <>
          <div className="rounded-2xl border border-kiosk-warning/50 bg-kiosk-warning/10 px-4 py-4">
            <p className="text-lg font-semibold text-slate-100">
              Ймовірний збіг знайдено, але товар не було додано до чека.
            </p>
          </div>
          <div className="space-y-3">
            {lastPrediction.uncertainItems.map((item) => (
              <div
                key={`uncertain-only-${item.label}-${item.quantity}-${item.confidence}`}
                className="platform-result-row border-kiosk-warning/40"
              >
                <div>
                  <p className="platform-result-tag">Ймовірний товар</p>
                  <p className="text-xl font-semibold text-slate-100">{item.name}</p>
                  <p className="platform-result-meta">{formatCurrency(item.price)}</p>
                </div>
                <div className="platform-result-summary">
                  <p className="platform-result-confidence text-kiosk-warning">
                    {Math.round(item.confidence * 100)}%
                  </p>
                  <p className="platform-result-meta">Повторіть сканування</p>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (recognitionStatus === 'error') {
      return (
        <>
          <div className="rounded-2xl border border-kiosk-danger/50 bg-kiosk-danger/10 px-4 py-4">
            <p className="text-lg font-semibold text-slate-100">
              {lastPrediction?.message ?? 'Розкладіть товар рівніше або зверніться до працівника.'}
            </p>
          </div>
          <AppButton variant="danger" size="md" fullWidth onClick={() => onRequestStaff('recognition_error')}>
            Покликати працівника
          </AppButton>
        </>
      );
    }

    return null;
  };

  return (
    <section className="kiosk-shell grid h-[calc(100vh-20px)] w-full grid-cols-12 gap-4 overflow-hidden px-4 py-4 lg:h-[calc(100vh-28px)]">
      <div className="col-span-12 panel flex min-h-0 flex-col overflow-hidden p-5 xl:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Етап сканування</p>
            <h1 className="mt-2 text-[clamp(2.7rem,4vw,4rem)] font-display font-bold leading-none text-white">
              Сканування на платформі
            </h1>
          </div>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4">
          <div className="panel-alt flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-200/85">Камера над платформою</p>
              <p className="mt-1 text-lg font-semibold text-slate-200 xl:text-xl">
                Верхня камера активна та готова до сканування
              </p>
            </div>
            <div className="h-4 w-4 rounded-full bg-kiosk-success shadow-[0_0_20px_rgba(42,210,111,0.9)]" />
          </div>

          <div className="platform-stage min-h-0 flex-1">
            <div className="platform-shell platform-portrait platform-preview-shell p-5 sm:p-6">
              <CameraPreview videoRef={cameraVideoRef} />
              <div className="camera-corner camera-corner-tl" />
              <div className="camera-corner camera-corner-tr" />
              <div className="camera-corner camera-corner-bl" />
              <div className="camera-corner camera-corner-br" />
              {isScanning && (
                <>
                  <div className="scan-line" />
                  <div className="platform-scan-overlay" />
                </>
              )}
            </div>

            <div className="platform-status-card">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200/85">
                {recognitionStatus === 'waiting' ? 'Як працювати зі сканером' : 'Результат сканування'}
              </p>
              <div className="mt-4">
                <RecognitionStatus status={recognitionStatus} />
              </div>
              <div className="platform-status-body">{renderStatusContent()}</div>
            </div>
          </div>

          <AppButton variant="primary" size="md" onClick={onStartScan} disabled={isScanning} fullWidth>
            Сканувати товари
          </AppButton>
        </div>
      </div>

      <div className="col-span-12 min-h-0 xl:col-span-4 xl:min-w-[420px]">
        <CartPanel
          items={cartItems}
          selectedItemId={selectedItemId}
          total={total}
          onSelectItem={onSelectItem}
          onDeleteSelected={onDeleteSelected}
          onClearCart={onClearCart}
          onCheckout={onCheckout}
          onRequestStaff={() => onRequestStaff('manual_request')}
        />
      </div>
    </section>
  );
};
