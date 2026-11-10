/** Restored from the original compiled export; application errors carry no credentials. */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}
export const ForbiddenError = (message: string) => new HttpError(403, message);
