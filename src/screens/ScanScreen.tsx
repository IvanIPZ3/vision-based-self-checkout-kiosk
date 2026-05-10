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
  const isEmptyResult = recognitionStatus === 'empty';
  const hasPredictionItems = Boolean(lastPrediction && lastPrediction.items.length > 0);
  const hasUncertainItems = Boolean(lastPrediction && lastPrediction.uncertainItems.length > 0);
  const confidenceText = lastPrediction
    ? lastPrediction.detected
      ? `${Math.round(lastPrediction.confidence * 100)}%`
      : hasUncertainItems
        ? 'Не підтверджено'
        : '0%'
    : '0%';
  const resultText = lastPrediction
    ? isEmptyResult
      ? 'Платформа порожня'
      : lastPrediction.detected
      ? 'Товар знайдено'
      : hasUncertainItems
        ? 'Система не впевнена'
        : 'Збіг не знайдено'
    : 'Збіг не знайдено';

  return (
    <section className="kiosk-shell grid min-h-[920px] w-full grid-cols-12 gap-4 px-5 py-5">
      <div className="col-span-12 panel flex min-h-[620px] flex-col p-7 xl:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Етап сканування</p>
            <h1 className="mt-2 text-5xl font-display font-bold text-white">Сканування на платформі</h1>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-5">
          <div className="panel-alt flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-200/85">Камера над платформою</p>
              <p className="mt-1 text-xl font-semibold text-slate-200">
                Верхня камера активна та готова до сканування
              </p>
            </div>
            <div className="h-4 w-4 rounded-full bg-kiosk-success shadow-[0_0_20px_rgba(42,210,111,0.9)]" />
          </div>

          <div className="platform-stage">
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

            <div className="platform-helper-card">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200/85">Як розмістити товар</p>
              <p className="mt-3 text-2xl font-display font-bold text-slate-100 sm:text-3xl">
                Покладіть один товар у межах рамки
              </p>
              <div className="mt-5 grid gap-3 text-left">
                <div className="platform-tip">
                  <span className="platform-tip-index">1</span>
                  <p>Вирівняйте товар по центру кадру</p>
                </div>
                <div className="platform-tip">
                  <span className="platform-tip-index">2</span>
                  <p>Приберіть руки та зайві предмети з платформи</p>
                </div>
                <div className="platform-tip">
                  <span className="platform-tip-index">3</span>
                  <p>Натисніть «Сканувати товари» після вирівнювання</p>
                </div>
              </div>
            </div>
          </div>

          <AppButton variant="primary" size="lg" onClick={onStartScan} disabled={isScanning} fullWidth>
            Сканувати товари
          </AppButton>

          <div className="panel-alt grid grid-cols-1 gap-4 p-4">
            <RecognitionStatus status={recognitionStatus} />
          </div>
        </div>

        {lastPrediction && (
          <div className="panel-alt mt-4 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Відповідь сервера</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-950/45 px-4 py-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Результат</p>
                <p className="mt-2 text-2xl font-display font-bold text-slate-100">{resultText}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/45 px-4 py-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Основна мітка</p>
                <p className="mt-2 text-2xl font-display font-bold text-slate-100">
                  {lastPrediction.label ?? 'Немає'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/45 px-4 py-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Впевненість</p>
                <p className="mt-2 text-2xl font-display font-bold text-slate-100">{confidenceText}</p>
              </div>
            </div>

            {lastPrediction.debug && (
              <p className="mt-4 text-sm font-semibold text-slate-400">
                Запуск #{lastPrediction.debug.runId ?? 'n/a'} | {lastPrediction.debug.filename ?? 'checkout-frame.jpg'} |{' '}
                {lastPrediction.debug.contentType ?? 'невідомий тип'} | {lastPrediction.debug.sizeBytes} bytes |{' '}
                {lastPrediction.debug.width ?? 0}x{lastPrediction.debug.height ?? 0} |{' '}
                {lastPrediction.debug.algorithmName ?? 'algorithm'} {lastPrediction.debug.algorithmVersion ?? ''}
              </p>
            )}
          </div>
        )}

        {(recognitionStatus === 'success' || recognitionStatus === 'partial') && hasPredictionItems && lastPrediction && (
          <div
            className={`mt-4 rounded-2xl border p-5 ${
              recognitionStatus === 'partial'
                ? 'border-kiosk-warning bg-gradient-to-r from-kiosk-warning/20 to-slate-900'
                : 'border-kiosk-success bg-gradient-to-r from-kiosk-success/20 to-slate-900'
            }`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">
              Результат останнього сканування
            </p>
            <div className="mt-3 space-y-2">
              {lastPrediction.items.map((item) => (
                <div
                  key={`${item.label}-${item.quantity}-${item.confidence}`}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl bg-slate-950/45 px-4 py-3"
                >
                  <div>
                    <p className="text-xl font-semibold text-slate-100">{item.name}</p>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
                      {item.label} | {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-slate-300">x{item.quantity}</p>
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-kiosk-accent">
                      {Math.round(item.confidence * 100)}%
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-400">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {lastPrediction.unresolvedCount > 0 && (
              <p className="mt-4 text-lg font-semibold text-kiosk-warning">
                Нерозпізнані позиції: {lastPrediction.unresolvedCount}
              </p>
            )}

            {hasUncertainItems && (
              <div className="mt-4 space-y-2 rounded-xl border border-kiosk-warning/60 bg-slate-950/40 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-kiosk-warning">
                  Сумнівні кандидати
                </p>
                {lastPrediction.uncertainItems.map((item) => (
                  <div
                    key={`uncertain-${item.label}-${item.quantity}-${item.confidence}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-kiosk-warning/40 bg-slate-950/45 px-4 py-3"
                  >
                    <div>
                      <p className="text-xl font-semibold text-slate-100">{item.name}</p>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
                        {item.label} | {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-display font-bold text-kiosk-warning">
                        {Math.round(item.confidence * 100)}%
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-300">Не додано до чека</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {recognitionStatus === 'uncertain' && hasUncertainItems && lastPrediction && (
          <div className="mt-4 rounded-2xl border border-kiosk-warning bg-gradient-to-r from-kiosk-warning/20 to-slate-900 p-5">
            <p className="text-3xl font-display font-bold text-kiosk-warning">
              Система не впевнена у розпізнаванні товару
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-100">
              Ймовірний збіг знайдено, але товар не було додано до чека.
            </p>
            <div className="mt-4 space-y-2">
              {lastPrediction.uncertainItems.map((item) => (
                <div
                  key={`uncertain-only-${item.label}-${item.quantity}-${item.confidence}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl bg-slate-950/45 px-4 py-3"
                >
                  <div>
                    <p className="text-xl font-semibold text-slate-100">{item.name}</p>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
                      {item.label} | {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-kiosk-warning">
                      {Math.round(item.confidence * 100)}%
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-300">Повторіть сканування</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isEmptyResult && (
          <div className="mt-4 rounded-2xl border border-sky-500/60 bg-gradient-to-r from-sky-500/12 to-slate-900 p-5">
            <p className="text-3xl font-display font-bold text-sky-200">На платформі не виявлено товарів</p>
            <p className="mt-2 text-xl font-semibold text-slate-100">
              {lastPrediction?.message ?? 'Покладіть один товар у межах рамки та натисніть «Сканувати товари».'}
            </p>
          </div>
        )}

        {recognitionStatus === 'error' && (
          <div className="mt-4 rounded-2xl border border-kiosk-danger bg-gradient-to-r from-kiosk-danger/20 to-slate-900 p-5">
            <p className="text-3xl font-display font-bold text-kiosk-danger">Не вдалося розпізнати товари</p>
            <p className="mt-2 text-xl font-semibold text-slate-100">
              {lastPrediction?.message ?? 'Розкладіть товари рівніше або зверніться до працівника'}
            </p>
            {lastPrediction && lastPrediction.unresolvedCount > 0 && (
              <p className="mt-3 text-lg font-semibold text-red-200">
                Нерозпізнані позиції: {lastPrediction.unresolvedCount}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <AppButton variant="danger" size="md" onClick={() => onRequestStaff('recognition_error')}>
                Покликати працівника
              </AppButton>
            </div>
          </div>
        )}
      </div>

      <div className="col-span-12 xl:col-span-4 xl:min-w-[420px]">
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
