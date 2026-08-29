import { useConfig } from '../lib/hooks/useConfig';
import { formatMoney } from '../lib/format/money';

interface MoneyProps {
  amount: number | null;
  currency: string;
  className?: string;
}

export function Money({ amount, currency, className = '' }: MoneyProps) {
  const { locale } = useConfig();
  return <span className={`tabular-nums ${className}`}>{formatMoney(amount, currency, locale)}</span>;
}
