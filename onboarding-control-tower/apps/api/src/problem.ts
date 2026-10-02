import type { FastifyReply, FastifyRequest } from 'fastify';

export interface ProblemField {
  field: string;
  message: string;
}

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  405: 'Method Not Allowed',
  500: 'Internal Server Error',
};

/** RFC 7807 Problem Details (PLAN §15). */
export function sendProblem(
  request: FastifyRequest,
  reply: FastifyReply,
  status: number,
  detail: string,
  errors?: ProblemField[],
): FastifyReply {
  const title = TITLES[status] ?? (status >= 500 ? 'Internal Server Error' : 'Bad Request');
  return reply
    .code(status)
    .type('application/problem+json')
    .send({
      type: `urn:oct:problem:${title.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      status,
      detail,
      instance: request.url.split('?')[0],
      ...(errors ? { errors } : {}),
    });
}
