interface EmptyStateProps {
  title: string;
  action?: { label: string; onClick: () => void };
}

/**
 * Asciutto, senza illustrazioni. Una schermata vuota che si scusa fa perdere tempo a chi la legge;
 * una che dice cosa manca e offre l'unica azione sensata no.
 */
export function EmptyState({ title, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
      <span className="text-sm font-medium text-ink-muted">{title}</span>
      {action === undefined ? null : (
        <button
          type="button"
          onClick={action.onClick}
          className="cursor-pointer text-[13px] text-accent underline underline-offset-2 hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
