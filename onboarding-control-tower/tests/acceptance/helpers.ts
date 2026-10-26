import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const EMPTY_BASE_URL = 'http://127.0.0.1:3101';

export const digits = (text: string | null): string => (text ?? '').replace(/\D/g, '');

export async function openDashboard(page: Page, query = ''): Promise<void> {
  await page.goto(`/${query}`);
  await expect(page.getByTestId('applications-table').or(page.getByTestId('empty-state'))).toBeVisible();
}

export async function getJson<T>(request: APIRequestContext, path: string): Promise<T> {
  const res = await request.get(path);
  expect(res.ok()).toBe(true);
  return (await res.json()) as T;
}

export interface SummaryKpis {
  kpis: {
    applications: { value: number };
    conversionPct: { value: number | null };
    avgDurationSec: { value: number | null };
    slaPct: { value: number | null };
  };
  sla: { warningCount: number; breachedCount: number };
  health: { alert: string | null; verificationError: { valuePct: number | null; changePct: number | null } };
}

export interface FunnelBody {
  stages: { stage: string; count: number }[];
  overallConversionPct: number | null;
}

export interface ApplicationListBody {
  items: { id: string; segment: string; status: string; slaStatus: string; elapsedSec: number }[];
}
