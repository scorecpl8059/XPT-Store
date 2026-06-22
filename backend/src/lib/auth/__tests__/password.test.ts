import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("hashPassword", () => {
  it("returns a bcrypt hash", async () => {
    const hash = await hashPassword("MyP@ssw0rd");
    expect(hash).toMatch(/^\$2[aby]?\$/);
    expect(hash).not.toBe("MyP@ssw0rd");
  });

  it("produces different hashes for the same password", async () => {
    const hash1 = await hashPassword("Test1234!");
    const hash2 = await hashPassword("Test1234!");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const hash = await hashPassword("CorrectP@ss1");
    const result = await verifyPassword("CorrectP@ss1", hash);
    expect(result).toBe(true);
  });

  it("returns false for incorrect password", async () => {
    const hash = await hashPassword("CorrectP@ss1");
    const result = await verifyPassword("WrongPassword1!", hash);
    expect(result).toBe(false);
  });

  it("returns false for empty password", async () => {
    const hash = await hashPassword("SomeP@ss1");
    const result = await verifyPassword("", hash);
    expect(result).toBe(false);
  });
});
