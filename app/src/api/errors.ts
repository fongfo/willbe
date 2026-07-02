/**
 * Error raised when the backend returns a non-success response.
 *
 * Carries the HTTP status and the server-provided message (from the
 * `{ success: false, error }` envelope) so callers can branch on either.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    // Restore the prototype chain (required when targeting older JS runtimes).
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
