import { ValidationError } from "./errors.js";

export const S = {
  string({ required = true, min = 0, max = 1000, trim = true } = {}) {
    return (value) => {
      if (value === undefined || value === null || value === "") {
        if (required) throw new ValidationError("field", "Required");
        return "";
      }
      let s = String(value);
      if (trim) s = s.trim();
      if (s.length < min) throw new ValidationError("field", `Too short (min ${min})`);
      if (s.length > max) throw new ValidationError("field", `Too long (max ${max})`);
      return s;
    };
  },
  number({ required = true, min = -Infinity, max = Infinity, integer = false } = {}) {
    return (value) => {
      if (value === undefined || value === null || value === "") {
        if (required) throw new ValidationError("field", "Required");
        return null;
      }
      const n = Number(value);
      if (Number.isNaN(n)) throw new ValidationError("field", "Not a number");
      if (integer && !Number.isInteger(n)) throw new ValidationError("field", "Must be an integer");
      if (n < min) throw new ValidationError("field", `Must be ≥ ${min}`);
      if (n > max) throw new ValidationError("field", `Must be ≤ ${max}`);
      return n;
    };
  },
  enum(values, { required = true } = {}) {
    return (value) => {
      if (value === undefined || value === null || value === "") {
        if (required) throw new ValidationError("field", "Required");
        return null;
      }
      if (!values.includes(value)) {
        throw new ValidationError("field", `Must be one of: ${values.join(", ")}`);
      }
      return value;
    };
  },
  array({ required = false, max = 1000 } = {}) {
    return (value) => {
      if (value === undefined || value === null) {
        if (required) throw new ValidationError("field", "Required");
        return [];
      }
      if (!Array.isArray(value)) throw new ValidationError("field", "Not an array");
      if (value.length > max) throw new ValidationError("field", `Too many items (max ${max})`);
      return value.slice();
    };
  },
  date({ required = true } = {}) {
    return (value) => {
      if (!value) {
        if (required) throw new ValidationError("field", "Required");
        return null;
      }
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) throw new ValidationError("field", "Invalid date");
      return d.toISOString().slice(0, 10);
    };
  },
  latLng() {
    return (value) => {
      if (!value || typeof value !== "object") throw new ValidationError("field", "Coordinate required");
      const { lat, lng } = value;
      if (typeof lat !== "number" || lat < -90 || lat > 90) throw new ValidationError("field", "Invalid latitude");
      if (typeof lng !== "number" || lng < -180 || lng > 180) throw new ValidationError("field", "Invalid longitude");
      return { lat, lng };
    };
  },
  object(shape) {
    return (value) => {
      if (!value || typeof value !== "object") throw new ValidationError("field", "Object required");
      const out = {};
      for (const [key, validator] of Object.entries(shape)) {
        try {
          out[key] = validator(value[key]);
        } catch (err) {
          if (err instanceof ValidationError) {
            err.details.field = key;
            err.message = `${key}: ${err.message}`;
          }
          throw err;
        }
      }
      return out;
    };
  },
};

export function validate(schema, value) {
  return schema(value);
}
