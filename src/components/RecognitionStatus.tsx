import type { RecognitionStatus as RecognitionStatusType } from '../types';

interface RecognitionStatusProps {
  status: RecognitionStatusType;
}

const statusConfig: Record<
  RecognitionStatusType,
  { title: string; toneClass: string; detail: string; chipClass: string; symbol: string }
> = {
  waiting: {
    title: 'Покладіть товари на платформу',
    toneClass: 'border-slate-600 bg-slate-900/75 text-slate-100',
    chipClass: 'border-slate-500 bg-slate-800 text-slate-200',
    symbol: '●',
    detail: 'Підготуйте товари та натисніть «Сканувати товари».',
  },
  scanning: {
    title: 'Сканування товарів...',
    toneClass: 'border-kiosk-warning bg-kiosk-warning/15 text-kiosk-warning',
    chipClass: 'status-pulse border-kiosk-warning bg-kiosk-warning/25 text-kiosk-warning',
    symbol: '◌',
    detail: 'Камера аналізує товари на платформі.',
  },
  success: {
    title: 'Знайдено товари. Їх додано до чека',
    toneClass: 'border-kiosk-success bg-kiosk-success/15 text-kiosk-success',
    chipClass: 'border-kiosk-success bg-kiosk-success/25 text-kiosk-success',
    symbol: '✓',
    detail: 'Сума та позиції в чеку оновлені.',
  },
  partial: {
    title: 'Частину товарів не вдалося впевнено розпізнати',
    toneClass: 'border-kiosk-warning bg-kiosk-warning/15 text-kiosk-warning',
    chipClass: 'border-kiosk-warning bg-kiosk-warning/25 text-kiosk-warning',
    symbol: '!',
    detail: 'Розпізнані товари вже додано до чека.',
  },
  uncertain: {
    title: 'Система не впевнена у результаті',
    toneClass: 'border-kiosk-warning bg-kiosk-warning/15 text-kiosk-warning',
    chipClass: 'border-kiosk-warning bg-kiosk-warning/25 text-kiosk-warning',
    symbol: '?',
    detail: 'Ймовірний товар знайдено, але його не додано до чека.',
  },
  empty: {
    title: 'На платформі не виявлено товарів',
    toneClass: 'border-sky-500/50 bg-sky-500/10 text-sky-200',
    chipClass: 'border-sky-400/50 bg-sky-500/15 text-sky-200',
    symbol: '○',
    detail: 'Покладіть один товар у межах рамки та натисніть «Сканувати товари».',
  },
  error: {
    title: 'Не вдалося розпізнати товари',
    toneClass: 'border-kiosk-danger bg-kiosk-danger/15 text-kiosk-danger',
    chipClass: 'border-kiosk-danger bg-kiosk-danger/25 text-kiosk-danger',
    symbol: '!',
    detail: 'Розкладіть товари рівніше або зверніться до працівника.',
  },
};

export const RecognitionStatus = ({ status }: RecognitionStatusProps) => {
  const config = statusConfig[status];

  return (
    <div className={`grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border px-5 py-4 ${config.toneClass}`}>
      <div className={`flex h-14 w-14 items-center justify-center rounded-full border text-2xl font-extrabold ${config.chipClass}`}>
        {config.symbol}
      </div>
      <div>
        <p className="text-2xl font-display font-bold">{config.title}</p>
        <p className="mt-1 text-base font-semibold text-slate-200">{config.detail}</p>
      </div>
    </div>
  );
};
