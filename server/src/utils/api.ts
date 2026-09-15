import type { NextFunction, Request, RequestHandler, Response } from "express";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const asyncHandler = (
  handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown> | unknown
): RequestHandler => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

export function sendData<T>(response: Response, data: T, status = 200, meta?: Record<string, unknown>) {
  return response.status(status).json(meta ? { data, meta } : { data });
}

export function requireValue<T>(value: T | undefined, code: string, message: string): T {
  if (value === undefined) {
    throw new ApiError(404, code, message);
  }
  return value;
}
