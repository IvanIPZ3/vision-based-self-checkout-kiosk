import { AppButton } from '../components/AppButton';
import type { ReceiptChoice } from '../types';
import { formatCurrency } from '../utils/format';

interface MobileSuccessScreenProps {
  total: number;
  receiptChoice: ReceiptChoice;
  onReceiptChoice: (choice: Exclude<ReceiptChoice, null>) => void;
  onFinish: () => void;
}

const receiptMessageMap: Record<Exclude<ReceiptChoice, null>, string> = {
  print: 'Чек буде надруковано',
  digital: 'Електронний чек надіслано',
};

export const MobileSuccessScreen = ({
  total,
  receiptChoice,
  onReceiptChoice,
  onFinish,
}: MobileSuccessScreenProps) => {
  return (
    <section className="mobile-page">
      <div className="mobile-card flex min-h-[78vh] flex-col justify-center p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kiosk-success">Оплату завершено</p>
        <h1 className="mt-3 text-4xl font-display font-extrabold text-white">Оплату успішно виконано</h1>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Фінальна сума</p>
        <p className="mt-2 text-5xl font-display font-extrabold text-kiosk-accent">{formatCurrency(total)}</p>

        <div className="mt-8 space-y-3">
          <AppButton variant="primary" size="md" fullWidth onClick={() => onReceiptChoice('print')}>
            Надрукувати чек
          </AppButton>
          <AppButton variant="secondary" size="md" fullWidth onClick={() => onReceiptChoice('digital')}>
            Електронний чек
          </AppButton>
          <AppButton variant="success" size="md" fullWidth onClick={onFinish}>
            Завершити
          </AppButton>
        </div>

        {receiptChoice && (
          <p className="mt-6 rounded-2xl border border-kiosk-accent/40 bg-kiosk-accent/10 px-4 py-3 text-base font-bold text-kiosk-accent">
            {receiptMessageMap[receiptChoice]}
          </p>
        )}
      </div>
    </section>
  );
};
