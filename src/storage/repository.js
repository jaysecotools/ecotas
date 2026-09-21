import { tx } from "./db.js";
import { ulid } from "../core/ids.js";
import { emit } from "../core/bus.js";
import { validate } from "../core/schema.js";
import { NotFoundError } from "../core/errors.js";

function nowISO() {
  return new Date().toISOString();
}

export function createRepository({ name, schema }) {
  if (!name || !schema) throw new Error("repository(name, schema) required");

  return {
    async list() {
      return tx(name, "readonly", (store) => new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }));
    },

    async get(id) {
      const row = await tx(name, "readonly", (store) => new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      }));
      if (!row) throw new NotFoundError(name, id);
      return row;
    },

    async create(input) {
      const cleaned = validate(schema, input);
      const row = { ...cleaned, id: ulid(), createdAt: nowISO(), updatedAt: nowISO() };
      await tx(name, "readwrite", (store) => store.put(row));
      await this._audit("create", name, row.id, row);
      emit(`${name}:created`, row);
      emit("store:changed", { name });
      return row;
    },

    async update(id, patch) {
      const existing = await this.get(id);
      const merged = { ...existing, ...patch };
      const cleaned = validate(schema, merged);
      const row = { ...cleaned, id, createdAt: existing.createdAt, updatedAt: nowISO() };
      await tx(name, "readwrite", (store) => store.put(row));
      await this._audit("update", name, id, { patch });
      emit(`${name}:updated`, row);
      emit("store:changed", { name });
      return row;
    },

    async remove(id) {
      const existing = await this.get(id);
      await tx(name, "readwrite", (store) => store.delete(id));
      await this._audit("delete", name, id, { removed: existing });
      emit(`${name}:deleted`, { id });
      emit("store:changed", { name });
      return existing;
    },

    async _audit(action, entity, entityId, details) {
      const entry = {
        id: ulid(),
        at: nowISO(),
        action,
        entity,
        entityId,
        details: details || null,
        actor: "local-user", // no multi-user auth in Stage 2
      };
      await tx("auditLog", "readwrite", (store) => store.put(entry));
    },
  };
}
