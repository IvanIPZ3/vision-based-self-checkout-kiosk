import { AppButton } from '../components/AppButton';
import type { PaymentStatus } from '../types';
import { formatCurrency } from '../utils/format';

interface PaymentScreenProps {
  total: number;
  paymentStatus: PaymentStatus;
  onPayByCard: () => void;
  onBackToCart: () => void;
  onRequestStaff: () => void;
}

export const PaymentScreen = ({
  total,
  paymentStatus,
  onPayByCard,
  onBackToCart,
  onRequestStaff,
}: PaymentScreenProps) => {
  const isProcessing = paymentStatus === 'processing';

  return (
    <section className="kiosk-shell mx-auto grid min-h-[760px] w-full max-w-5xl grid-cols-1 px-5 py-5">
      <div className="panel flex flex-col justify-between p-10">
        {!isProcessing && (
          <>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Етап оплати</p>
              <h1 className="mt-3 text-6xl font-display font-bold text-white">Оберіть спосіб оплати</h1>
              <p className="mt-8 text-lg font-semibold text-slate-300">Сума до оплати</p>
              <p className="mt-2 text-7xl font-display font-extrabold text-kiosk-accent">{formatCurrency(total)}</p>
            </div>

            <div className="mt-10 grid gap-4">
              <AppButton variant="primary" size="lg" fullWidth onClick={onPayByCard}>
                Оплата банківською карткою
              </AppButton>
              <AppButton variant="ghost" size="lg" fullWidth onClick={onBackToCart}>
                Повернутися до сканування
              </AppButton>
              <AppButton variant="secondary" size="md" fullWidth onClick={onRequestStaff}>
                Покликати працівника
              </AppButton>
            </div>
          </>
        )}

        {isProcessing && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="h-28 w-28 animate-spin rounded-full border-4 border-kiosk-accent/40 border-t-kiosk-accent" />
            <p className="mt-9 text-6xl font-display font-bold text-white">Очікування оплати...</p>
            <p className="mt-5 text-3xl font-semibold text-slate-200">Прикладіть або вставте картку в термінал</p>
            <p className="mt-7 text-xl font-semibold text-slate-300">Сума: {formatCurrency(total)}</p>
            <AppButton className="mt-8" variant="ghost" size="md" onClick={onRequestStaff}>
              Проблема з оплатою
            </AppButton>
          </div>
        )}
      </div>
    </section>
  );
};
