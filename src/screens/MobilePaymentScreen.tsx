import { AppButton } from '../components/AppButton';
import type { PaymentStatus } from '../types';
import { formatCurrency } from '../utils/format';

interface MobilePaymentScreenProps {
  total: number;
  paymentStatus: PaymentStatus;
  onPayByCard: () => void;
  onBackToCart: () => void;
  onRequestStaff: () => void;
}

export const MobilePaymentScreen = ({
  total,
  paymentStatus,
  onPayByCard,
  onBackToCart,
  onRequestStaff,
}: MobilePaymentScreenProps) => {
  const isProcessing = paymentStatus === 'processing';

  return (
    <section className="mobile-page">
      <div className="mobile-card p-5">
        {!isProcessing && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Оплата</p>
              <h1 className="mt-2 text-3xl font-display font-extrabold text-white">Підтвердження оплати</h1>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">До сплати</p>
              <p className="mt-2 text-5xl font-display font-extrabold text-kiosk-accent">{formatCurrency(total)}</p>
            </div>

            <div className="space-y-3">
              <AppButton variant="primary" size="md" fullWidth onClick={onPayByCard}>
                Оплатити карткою
              </AppButton>
              <AppButton variant="ghost" size="md" fullWidth onClick={onBackToCart}>
                Повернутися до сканування
              </AppButton>
              <AppButton variant="secondary" size="md" fullWidth onClick={onRequestStaff}>
                Покликати працівника
              </AppButton>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="h-20 w-20 animate-spin rounded-full border-4 border-kiosk-accent/25 border-t-kiosk-accent" />
            <h1 className="mt-6 text-3xl font-display font-extrabold text-white">Оплата виконується</h1>
            <p className="mt-3 text-base font-semibold text-slate-300">Прикладіть або вставте картку в термінал.</p>
            <p className="mt-4 text-xl font-display font-bold text-kiosk-accent">{formatCurrency(total)}</p>
            <AppButton className="mt-6" variant="ghost" size="md" fullWidth onClick={onRequestStaff}>
              Проблема з оплатою
            </AppButton>
          </div>
        )}
      </div>
    </section>
  );
};
