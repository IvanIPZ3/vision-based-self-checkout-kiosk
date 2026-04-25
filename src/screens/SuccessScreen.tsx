import type { ReceiptChoice } from '../types';
import { formatCurrency } from '../utils/format';
import { AppButton } from '../components/AppButton';

interface SuccessScreenProps {
  total: number;
  receiptChoice: ReceiptChoice;
  onReceiptChoice: (choice: Exclude<ReceiptChoice, null>) => void;
  onFinish: () => void;
}

const receiptMessageMap: Record<Exclude<ReceiptChoice, null>, string> = {
  print: 'Чек буде надруковано',
  digital: 'Електронний чек надіслано',
};

export const SuccessScreen = ({ total, receiptChoice, onReceiptChoice, onFinish }: SuccessScreenProps) => {
  return (
    <section className="kiosk-shell mx-auto grid min-h-[760px] w-full max-w-5xl grid-cols-1 px-5 py-5">
      <div className="panel flex flex-col items-center justify-center p-10 text-center">
        <p className="text-lg font-semibold uppercase tracking-wider text-kiosk-success">Оплата завершена</p>
        <h1 className="mt-4 text-6xl font-display font-extrabold text-white sm:text-7xl">Оплату успішно виконано</h1>
        <p className="mt-8 text-xl font-semibold text-slate-300">Фінальна сума</p>
        <p className="mt-2 text-7xl font-display font-extrabold text-kiosk-accent">{formatCurrency(total)}</p>

        <div className="mt-12 grid w-full max-w-3xl gap-4">
          <AppButton variant="primary" size="lg" fullWidth onClick={() => onReceiptChoice('print')}>
            Надрукувати чек
          </AppButton>
          <AppButton variant="secondary" size="lg" fullWidth onClick={() => onReceiptChoice('digital')}>
            Електронний чек
          </AppButton>
          <AppButton variant="success" size="lg" fullWidth onClick={onFinish}>
            Завершити
          </AppButton>
        </div>

        {receiptChoice && (
          <p className="mt-7 rounded-xl border border-kiosk-accent/50 bg-kiosk-accent/10 px-6 py-4 text-2xl font-semibold text-kiosk-accent">
            {receiptMessageMap[receiptChoice]}
          </p>
        )}
      </div>
    </section>
  );
};
