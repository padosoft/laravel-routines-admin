import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'attention';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover border-0',
  attention: 'bg-attention text-surface hover:opacity-90 border-0',
  secondary:
    'bg-surface text-ink border border-border-strong hover:border-accent hover:text-accent',
  ghost: 'bg-transparent text-ink-muted border-0 hover:text-ink',
  danger: 'bg-surface text-danger border border-danger hover:bg-danger hover:text-surface',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

/**
 * Ogni sfondo su token porta la sua controparte di testo — `text-on-accent` sopra `bg-accent`,
 * `text-surface` sopra `bg-attention`. Un `text-white` qui sarebbe giusto in scuro e invisibile
 * in chiaro, e nessuno se ne accorgerebbe finché non cambia tema.
 */
export function Button({ variant = 'secondary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-[6px] px-3.5 text-[13px] font-medium transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
