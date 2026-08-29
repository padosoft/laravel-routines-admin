import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { usePermission, type Permission } from '../lib/hooks/usePermission';
import { t } from '../lib/i18n';

interface PermissionBannerProps {
  permission: Permission;
  message?: string;
}

/**
 * Chi non ha il permesso VEDE comunque la pagina, con i comandi disattivati e una fascia che
 * spiega perché. Nasconderla del tutto lascerebbe la persona a chiedersi se la pagina esista;
 * così sa cosa c'è e cosa le manca per usarla.
 */
export function PermissionBanner({ permission, message }: PermissionBannerProps) {
  const allowed = usePermission(permission);
  if (allowed) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center gap-3.5 rounded-[10px] border border-border border-l-[3px] border-l-warn bg-warn-subtle px-[18px] py-3.5">
      <Lock className="size-[17px] shrink-0 text-warn" strokeWidth={1.75} aria-hidden="true" />
      <span className="max-w-[80ch] text-[13px] text-ink-muted">
        {message ?? t.permission.denied}
      </span>
    </div>
  );
}

interface PermissionGateProps {
  permission: Permission;
  children: (allowed: boolean, reason: string) => ReactNode;
}

const REASON: Record<Permission, string> = {
  'routines.read': t.permission.denied,
  'routines.write': t.permission.needsWrite,
  'routines.fire': t.permission.needsFire,
  'routines.approve': t.permission.needsApprove,
};

/** Passa `allowed` e il motivo, così il chiamante decide se disabilitare o spiegare. */
export function PermissionGate({ permission, children }: PermissionGateProps) {
  const allowed = usePermission(permission);
  return <>{children(allowed, REASON[permission])}</>;
}
