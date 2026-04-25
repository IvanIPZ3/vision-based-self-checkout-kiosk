import type { StaffHelpReason } from '../types';
import { AppButton } from '../components/AppButton';

interface StaffHelpScreenProps {
  reason: StaffHelpReason;
  onBack: () => void;
}

const reasonLabelMap: Record<Exclude<StaffHelpReason, null>, string> = {
  recognition_error: 'Причина: товари не вдалося впевнено розпізнати',
  payment_problem: 'Причина: проблема з оплатою',
  manual_request: 'Причина: ручний запит користувача',
};

export const StaffHelpScreen = ({ reason, onBack }: StaffHelpScreenProps) => {
  return (
    <section className="kiosk-shell mx-auto grid min-h-[760px] w-full max-w-4xl grid-cols-1 px-5 py-5">
      <div className="panel flex flex-col items-center justify-center p-10 text-center">
        <p className="text-lg font-semibold uppercase tracking-wider text-kiosk-warning">Службове повідомлення</p>
        <h1 className="mt-4 text-6xl font-display font-extrabold text-white">Працівника викликано</h1>
        <p className="mt-7 text-3xl font-semibold text-slate-200">
          {reason ? reasonLabelMap[reason] : 'Причина: уточнюється'}
        </p>
        <p className="mt-4 text-xl font-semibold text-slate-300">Залишайтеся біля термінала, працівник вже в дорозі.</p>

        <AppButton className="mt-10" variant="primary" size="lg" onClick={onBack}>
          Повернутися назад
        </AppButton>
      </div>
    </section>
  );
};
