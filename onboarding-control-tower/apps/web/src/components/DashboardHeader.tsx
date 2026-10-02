import { PERIODS, SEGMENTS, type Period, type SegmentFilter } from '../api/types';
import { formatDateTime } from '../i18n/format';
import { PERIOD_LABEL, SEGMENT_LABEL } from '../i18n/labels';
import { FilterGroup } from './FilterGroup';

interface Props {
  period: Period;
  segment: SegmentFilter;
  referenceNow: string | undefined;
  onPeriod: (p: Period) => void;
  onSegment: (s: SegmentFilter) => void;
}

export function DashboardHeader({ period, segment, referenceNow, onPeriod, onSegment }: Props) {
  return (
    <header className="bg-ink text-surface">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-6 px-8 py-5">
        <div className="flex items-center gap-4">
          <div
            aria-hidden
            className="grid h-11 w-11 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/30"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M5 19V11M12 19V5M19 19v-6" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Customer Onboarding Control Tower</h1>
            <p className="text-sm text-surface/70">
              Rendimiento del onboarding digital · datos sintéticos
              {referenceNow && (
                <>
                  {' '}
                  a <time dateTime={referenceNow}>{formatDateTime(referenceNow)}</time>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <FilterGroup
            label="Periodo"
            name="period"
            options={PERIODS}
            labels={PERIOD_LABEL}
            value={period}
            onChange={onPeriod}
          />
          <FilterGroup
            label="Segmento"
            name="segment"
            options={SEGMENTS}
            labels={SEGMENT_LABEL}
            value={segment}
            onChange={onSegment}
          />
        </div>
      </div>
    </header>
  );
}
