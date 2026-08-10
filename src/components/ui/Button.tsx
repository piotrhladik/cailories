// ============================================================================
// Button.tsx — wielokrotnie użyteczny przycisk z wariantami i obszarem dotyku
// (min 44px). Mikro-interakcje (tap/hover) realizowane przez transformacje CSS
// — brak konfliktu typów na zdarzeniach; zachowany płynny efekt.
// ============================================================================

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger-ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  'danger-ghost': 'btn-danger-ghost',
};

export function Button({
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button
      disabled={disabled}
      className={`${VARIANT_CLASS[variant]} ${className} transition-transform duration-150 ease-out active:scale-95 hover:scale-[1.02]`}
      {...rest}
    >
      {children}
    </button>
  );
}