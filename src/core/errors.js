export class EcoError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "EcoError";
    this.code = code;
    this.details = details || null;
  }
}

export class ValidationError extends EcoError {
  constructor(field, message) {
    super("VALIDATION", message || `Invalid value for ${field}`, { field });
    this.name = "ValidationError";
  }
}

export class NotFoundError extends EcoError {
  constructor(entity, id) {
    super("NOT_FOUND", `${entity} not found: ${id}`, { entity, id });
    this.name = "NotFoundError";
  }
}
