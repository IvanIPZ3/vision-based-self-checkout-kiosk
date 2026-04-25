import { AppButton } from '../components/AppButton';

interface StartScreenProps {
  onStart: () => void;
  onRequestStaff: () => void;
}

export const StartScreen = ({ onStart, onRequestStaff }: StartScreenProps) => {
  return (
    <section className="kiosk-shell mx-auto flex min-h-[820px] w-full max-w-6xl flex-col px-7 py-7">
      <div className="panel flex h-full flex-col items-center justify-center px-8 py-12 text-center">
        <p className="text-lg font-semibold uppercase tracking-[0.3em] text-kiosk-accent">Термінал самообслуговування</p>
        <h1 className="mt-5 text-7xl font-display font-extrabold text-white sm:text-9xl">Самокаса</h1>
        <p className="mt-7 max-w-3xl text-3xl font-semibold leading-snug text-slate-200">
          Сканування товарів на платформі за допомогою верхньої камери
        </p>

        <div className="mt-14 grid w-full max-w-3xl gap-5">
          <AppButton variant="primary" size="lg" fullWidth onClick={onStart}>
            Почати покупку
          </AppButton>
          <AppButton variant="ghost" size="lg" fullWidth onClick={onRequestStaff}>
            Покликати працівника
          </AppButton>
        </div>
      </div>
    </section>
  );
};
