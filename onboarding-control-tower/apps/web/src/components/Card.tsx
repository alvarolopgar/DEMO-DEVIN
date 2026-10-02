import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  testId?: string;
  className?: string;
  children: ReactNode;
}

export function Card({ title, subtitle, aside, testId, className = '', children }: CardProps) {
  return (
    <section
      data-testid={testId}
      aria-label={title}
      className={`flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_2px_0_var(--token-border)] ${className}`}
    >
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {aside}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
