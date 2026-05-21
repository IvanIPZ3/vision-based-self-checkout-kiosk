import { AppButton } from '../components/AppButton';
import type { StaffHelpReason } from '../types';

interface MobileStaffHelpScreenProps {
  reason: StaffHelpReason;
  onBack: () => void;
}

const reasonLabelMap: Record<Exclude<StaffHelpReason, null>, string> = {
  recognition_error: 'Не вдалося впевнено розпізнати книгу.',
  payment_problem: 'Потрібна допомога з оплатою.',
  manual_request: 'Користувач викликав працівника вручну.',
};

export const MobileStaffHelpScreen = ({ reason, onBack }: MobileStaffHelpScreenProps) => {
  return (
    <section className="mobile-page">
      <div className="mobile-card flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kiosk-warning">Службове повідомлення</p>
        <h1 className="mt-3 text-4xl font-display font-extrabold text-white">Працівника викликано</h1>
        <p className="mt-4 text-base font-semibold text-slate-200">
          {reason ? reasonLabelMap[reason] : 'Причина запиту уточнюється.'}
        </p>
        <p className="mt-3 text-sm font-semibold text-slate-400">Залишайтеся біля пристрою. Працівник уже в дорозі.</p>
        <AppButton className="mt-8" variant="primary" size="md" fullWidth onClick={onBack}>
          Повернутися назад
        </AppButton>
      </div>
    </section>
  );
};
