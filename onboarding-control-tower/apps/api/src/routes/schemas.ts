import { z } from 'zod';
import { PERIODS, SEGMENT_FILTERS } from '../domain/types.js';

export const filterQuery = z
  .object({
    period: z.enum(PERIODS).default('30d'),
    segment: z.enum(SEGMENT_FILTERS).default('ALL'),
  })
  .strict();

export const listQuery = filterQuery.extend({ limit: z.coerce.number().int().min(1).max(50).default(20) }).strict();

export const applicationParams = z.object({ id: z.string().regex(/^CL-\d{5}$/, 'Formato esperado CL-NNNNN') }).strict();
