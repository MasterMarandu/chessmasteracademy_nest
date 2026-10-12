import type { ReactNode } from 'react';

export default function IconButton({ label, children, onClick, disabled, className = '' }: {
  label: string; children: ReactNode; onClick: () => void; disabled?: boolean; className?: string;
}) {
  return <button type="button" className={`icon-button ${className}`} title={label} aria-label={label} disabled={disabled} onClick={onClick}>{children}</button>;
}
