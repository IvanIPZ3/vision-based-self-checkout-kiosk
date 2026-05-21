import { useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { AppButton } from '../components/AppButton';
import { CameraPreview } from '../components/CameraPreview';
import { RecognitionStatus } from '../components/RecognitionStatus';
import type { CartItem, PredictionResponse, RecognitionStatus as RecognitionStatusType } from '../types';
import { formatCurrency } from '../utils/format';

interface MobileScanScreenProps {
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

const isEmptyPlatformMessage = (message: string | null | undefined) =>
  typeof message === 'string' && message.startsWith('На платформі не виявлено товарів');

export const MobileScanScreen = ({
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
}: MobileScanScreenProps) => {
  const cartSectionRef = useRef<HTMLElement | null>(null);
  const isScanning = recognitionStatus === 'scanning';
  const itemsCount = useMemo(() => cartItems.reduce((count, item) => count + item.quantity, 0), [cartItems]);
  const hasItems = cartItems.length > 0;
  const hasPredictionItems = Boolean(lastPrediction && lastPrediction.items.length > 0);
  const hasUncertainItems = Boolean(lastPrediction && lastPrediction.uncertainItems.length > 0);

  const scrollToCart = () => {
    cartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderResultContent = () => {
    if (recognitionStatus === 'waiting') {
      return (
        <ol className="space-y-2 text-sm font-semibold text-slate-300">
          <li className="mobile-tip-row">
            <span className="mobile-tip-index">1</span>
            <span>Розмістіть одну книгу в центрі кадру.</span>
          </li>
          <li className="mobile-tip-row">
            <span className="mobile-tip-index">2</span>
            <span>Заберіть руки й сторонні предмети з платформи.</span>
          </li>
          <li className="mobile-tip-row">
            <span className="mobile-tip-index">3</span>
            <span>Натисніть «Сканувати», коли книга лежить нерухомо.</span>
          </li>
        </ol>
      );
    }

    if (recognitionStatus === 'scanning') {
      return <p className="text-sm font-semibold text-slate-300">Камера аналізує кадр. Утримуйте книгу в межах рамки.</p>;
    }

    if ((recognitionStatus === 'success' || recognitionStatus === 'partial') && hasPredictionItems && lastPrediction) {
      return (
        <div className="space-y-3">
          {lastPrediction.items.map((item) => (
            <div key={`${item.label}-${item.quantity}-${item.confidence}`} className="mobile-result-card">
              <div>
                <p className="text-base font-bold text-slate-100">{item.name}</p>
                <p className="mt-1 text-sm font-semibold text-slate-400">{formatCurrency(item.price)} за одиницю</p>
              </div>
              <div className="text-right">
                <p className="text-base font-display font-bold text-kiosk-accent">x{item.quantity}</p>
                <p className="mt-1 text-base font-display font-bold text-white">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}

          {hasUncertainItems && (
            <div className="rounded-2xl border border-kiosk-warning/40 bg-kiosk-warning/10 px-4 py-3">
              <p className="text-sm font-semibold text-kiosk-warning">Частину товарів не вдалося впевнено підтвердити. Вони не додані до чека.</p>
            </div>
          )}
        </div>
      );
    }

    if (recognitionStatus === 'uncertain' && hasUncertainItems && lastPrediction) {
      return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-300">Система бачить імовірний товар, але не додала його до чека.</p>
          {lastPrediction.uncertainItems.map((item) => (
            <div key={`uncertain-${item.label}-${item.confidence}`} className="mobile-result-card border-kiosk-warning/40">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-kiosk-warning">Ймовірний товар</p>
                <p className="mt-1 text-base font-bold text-slate-100">{item.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-display font-bold text-kiosk-warning">{Math.round(item.confidence * 100)}%</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Не додано</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (recognitionStatus === 'empty') {
      return (
        <p className="text-sm font-semibold text-slate-300">
          {lastPrediction?.message && isEmptyPlatformMessage(lastPrediction.message)
            ? lastPrediction.message
            : 'На платформі не виявлено товарів. Покладіть одну книгу в межах рамки та повторіть сканування.'}
        </p>
      );
    }

    if (recognitionStatus === 'error') {
      return (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-300">
            {lastPrediction?.message ?? 'Не вдалося розпізнати книгу. Розкладіть її рівніше або зверніться до працівника.'}
          </p>
          <AppButton variant="danger" size="md" fullWidth onClick={() => onRequestStaff('recognition_error')}>
            Покликати працівника
          </AppButton>
        </div>
      );
    }

    return null;
  };

  return (
    <section className="mobile-page">
      <header className="mobile-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-kiosk-accent">Мобільний режим</p>
        <h1 className="mt-2 text-3xl font-display font-extrabold text-white">Сканування книги</h1>
        <p className="mt-2 text-sm font-semibold text-slate-300">Вертикальний інтерфейс для смартфона. Кадр, кнопка і результат зібрані в одному екрані.</p>
      </header>

      <div className="mobile-card p-3">
        <div className="platform-shell mobile-camera-shell">
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
      </div>

      <AppButton variant="primary" size="md" fullWidth onClick={onStartScan} disabled={isScanning}>
        {isScanning ? 'Сканування...' : 'Сканувати'}
      </AppButton>

      <div className="mobile-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          {recognitionStatus === 'waiting' ? 'Підказки' : 'Результат сканування'}
        </p>
        <div className="mt-3">
          <RecognitionStatus status={recognitionStatus} />
        </div>
        <div className="mt-4 space-y-3">{renderResultContent()}</div>
      </div>

      <section ref={cartSectionRef} className="mobile-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Поточний чек</p>
            <h2 className="mt-1 text-2xl font-display font-bold text-white">Товари</h2>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Позицій</p>
            <p className="text-xl font-display font-extrabold text-kiosk-accent">{itemsCount}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {!hasItems && (
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-5 text-center">
              <p className="text-base font-bold text-slate-100">Чек порожній</p>
              <p className="mt-2 text-sm font-semibold text-slate-400">Відскануйте книгу, і вона з’явиться тут.</p>
            </div>
          )}

          {cartItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem(item.id)}
              className={`mobile-cart-item ${selectedItemId === item.id ? 'mobile-cart-item-selected' : ''}`}
            >
              <div>
                <p className="text-base font-bold text-slate-100">{item.name}</p>
                <p className="mt-1 text-sm font-semibold text-slate-400">{formatCurrency(item.price)} за одиницю</p>
              </div>
              <div className="text-right">
                <p className="rounded-full border border-slate-600 bg-slate-950/70 px-3 py-1 text-sm font-bold text-slate-100">
                  x{item.quantity}
                </p>
                <p className="mt-2 text-base font-display font-bold text-kiosk-accent">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-kiosk-accent/40 bg-gradient-to-r from-kiosk-accent/15 to-kiosk-action/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Разом</p>
          <p className="mt-2 text-4xl font-display font-extrabold text-kiosk-accent">{formatCurrency(total)}</p>
        </div>

        <div className="mt-4 space-y-3">
          <AppButton variant="danger" size="md" fullWidth disabled={!selectedItemId} onClick={onDeleteSelected}>
            Видалити обрану позицію
          </AppButton>
          <AppButton variant="ghost" size="md" fullWidth disabled={!hasItems} onClick={onClearCart}>
            Очистити чек
          </AppButton>
          <AppButton variant="secondary" size="md" fullWidth onClick={() => onRequestStaff('manual_request')}>
            Покликати працівника
          </AppButton>
        </div>
      </section>

      <div className="mobile-sticky-summary">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Чек</p>
          <p className="mt-1 text-sm font-bold text-white">{itemsCount} поз. • {formatCurrency(total)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToCart}
            className="rounded-xl border border-slate-600 bg-transparent px-3 py-2 text-sm font-bold text-slate-100 transition hover:bg-slate-800/70"
          >
            До чека
          </button>
          <button
            type="button"
            disabled={!hasItems}
            onClick={onCheckout}
            className="rounded-xl border border-transparent bg-kiosk-success px-3 py-2 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            Оплатити
          </button>
        </div>
      </div>
    </section>
  );
};
