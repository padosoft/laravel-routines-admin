import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  /** Larghezza della colonna nella grid template: `132px`, `minmax(220px,1fr)`, … */
  width: string;
  align?: 'left' | 'right';
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Riga evidenziata: un fire in corso, o una appena arrivata via polling. */
  rowClassName?: (row: T) => string;
  caption: string;
  empty?: ReactNode;
  rowHeight?: string;
}

/**
 * Una `<table>` vera, con `<th scope="col">`.
 *
 * Il prototipo usa `role="row"` su dei div perché è HTML disegnato a mano; qui no. Uno screen
 * reader su una tabella vera annuncia riga e colonna, e su una griglia di div annuncia una
 * sequenza di testi senza struttura — che per un ledger significa perdere il senso di ciò che
 * si sta leggendo.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowClassName,
  caption,
  empty,
  rowHeight = 'h-11',
}: DataTableProps<T>) {
  const template = columns.map((c) => c.width).join(' ');

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-card">
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr
            className="grid h-[38px] items-center gap-3 border-b border-border bg-surface-muted px-4"
            style={{ gridTemplateColumns: template }}
          >
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted ${
                  column.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick === undefined ? undefined : () => onRowClick(row)}
              className={`grid items-center gap-3 border-b border-border px-4 last:border-b-0 ${rowHeight} ${
                onRowClick === undefined ? '' : 'cursor-pointer hover:bg-surface-muted'
              } ${rowClassName?.(row) ?? ''}`}
              style={{ gridTemplateColumns: template }}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`min-w-0 ${column.align === 'right' ? 'text-right' : ''}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && empty !== undefined ? empty : null}
    </div>
  );
}
