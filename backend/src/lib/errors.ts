export type FieldErrors = Record<string, string>;

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: FieldErrors;
  readonly headers?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: FieldErrors,
    headers?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.headers = headers;
  }
}

export const validationFailed = (fields: FieldErrors) =>
  new AppError(400, "validation_failed", "Some fields are invalid.", fields);

export const unauthenticated = (message = "Sign in to continue.") =>
  new AppError(401, "unauthenticated", message);

export const forbidden = (message = "You do not have access to this resource.") =>
  new AppError(403, "forbidden", message);

export const notFound = (message = "Not found.") => new AppError(404, "not_found", message);

export const invalidCredentials = () =>
  new AppError(401, "invalid_credentials", "Email or password is incorrect.");

export const emailTaken = () => new AppError(409, "email_taken", "That email is already registered.");

export const slugTaken = () => new AppError(409, "slug_taken", "That slug is already in use.");

export const slotTaken = () =>
  new AppError(409, "slot_taken", "That featured slot is already taken.");

export const invalidOtp = () => new AppError(400, "invalid_otp", "That code is not valid.");

export const otpExpired = () => new AppError(400, "otp_expired", "That code has expired.");

export const otpExhausted = () =>
  new AppError(400, "otp_exhausted", "Too many attempts. Request a new code.");

export const cannotModifySelf = () =>
  new AppError(400, "cannot_modify_self", "You cannot change your own account here.");

export const deliveryFailed = () =>
  new AppError(502, "delivery_failed", "The message could not be delivered right now.");

/** Drizzle wraps driver errors, so walk the cause chain for Postgres error codes. */
export function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current = error as { code?: string; cause?: unknown } | undefined;
  while (current && !seen.has(current)) {
    seen.add(current);
    if (current.code === "23505") return true;
    current = current.cause as typeof current;
  }
  return false;
}
