import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type ButtonSize = 'md' | 'lg';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-kiosk-action text-slate-950 hover:bg-sky-300 focus-visible:outline-kiosk-action',
  secondary:
    'border-slate-500/90 bg-slate-700/90 text-white hover:bg-slate-600 focus-visible:outline-slate-400',
  danger:
    'border-transparent bg-kiosk-danger text-white hover:bg-red-400 focus-visible:outline-kiosk-danger',
  ghost: 'border-slate-500/90 bg-transparent text-white hover:bg-slate-700/60 focus-visible:outline-slate-300',
  success:
    'border-transparent bg-kiosk-success text-slate-950 hover:bg-emerald-300 focus-visible:outline-kiosk-success',
};

const sizeClassMap: Record<ButtonSize, string> = {
  md: 'min-h-[68px] px-6 py-4 text-xl',
  lg: 'min-h-[84px] px-8 py-5 text-2xl',
};

export const AppButton = ({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  className = '',
  ...buttonProps
}: AppButtonProps) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl border font-display font-bold transition duration-200 active:scale-[0.99] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500 ${variantClassMap[variant]} ${sizeClassMap[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
};
