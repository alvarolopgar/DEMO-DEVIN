import { useRef, type KeyboardEvent } from 'react';

interface FilterGroupProps<T extends string> {
  label: string;
  name: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}

/** Control segmentado accesible (`radiogroup`) con navegación por flechas. */
export function FilterGroup<T extends string>({ label, name, options, labels, value, onChange }: FilterGroupProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    const option = options[next];
    if (option === undefined) return;
    onChange(option);
    refs.current[next]?.focus();
  };

  return (
    <div className="flex items-center gap-3">
      <span id={`${name}-label`} className="text-xs font-medium uppercase tracking-wider text-subtle">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${name}-label`}
        data-testid={`filter-${name}`}
        className="flex rounded-xl bg-surface/10 p-1 ring-1 ring-inset ring-surface/15"
      >
        {options.map((option, i) => {
          const checked = option === value;
          return (
            <button
              key={option}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              data-value={option}
              onClick={() => onChange(option)}
              onKeyDown={(e) => onKey(e, i)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                checked ? 'bg-surface text-ink shadow-sm' : 'text-surface/80 hover:bg-surface/10 hover:text-surface'
              }`}
            >
              {labels[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
