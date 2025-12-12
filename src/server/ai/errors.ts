export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'CONFIG_ERROR'
  | 'UPSTREAM_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export type ApiErrorBody = {
  error: string;
  code: ApiErrorCode;
  details?: string;
  retryable?: boolean;
};

export function jsonError(
  status: number,
  body: ApiErrorBody
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

export function toErrorBody(err: unknown): ApiErrorBody {
  if (err instanceof Error) {
    return {
      error: err.message,
      code: 'INTERNAL_ERROR'
    };
  }

  return {
    error: 'Unknown error',
    code: 'INTERNAL_ERROR'
  };
}


