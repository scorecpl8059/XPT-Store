import { describe, it, expect } from "vitest";
import { generateId } from "../id";

describe("generateId", () => {
  it("returns a ULID string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id).toHaveLength(26);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("generates sortable IDs (later IDs are greater)", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id2 >= id1).toBe(true);
  });
});
