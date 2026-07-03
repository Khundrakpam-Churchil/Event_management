/**
 * Typed application error with an error code and HTTP status.
 * Service-layer functions should throw AppError for expected error conditions.
 * Route handlers catch AppError and convert it to the standard envelope format.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;

    // Maintains proper prototype chain in compiled TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}
