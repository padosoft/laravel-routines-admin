import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Bordo sinistro colorato: il modo del pannello per dire «questo riquadro ha un tono». */
  accent?: 'attention' | 'warn' | 'danger' | 'accent' | 'ok' | null;
  padded?: boolean;
}

const ACCENT: Record<string, string> = {
  attention: 'border-l-[3px] border-l-attention bg-attention-subtle',
  warn: 'border-l-[3px] border-l-warn bg-warn-subtle',
  danger: 'border-l-[3px] border-l-danger bg-danger-subtle',
  accent: 'border-l-[3px] border-l-accent',
  ok: 'border-l-[3px] border-l-ok',
};

export function Card({ children, className = '', accent = null, padded = true }: CardProps) {
  const tone = accent === null ? '' : ACCENT[accent];

  return (
    <div
      className={`rounded-[10px] border border-border bg-surface shadow-card ${tone ?? ''} ${padded ? 'p-5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  right?: ReactNode;
}

export function CardHeader({ title, right }: CardHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-[14px]">
      <h2 className="font-sans text-[13px] font-semibold">{title}</h2>
      {right === undefined ? null : <div className="ml-auto">{right}</div>}
    </div>
  );
}
