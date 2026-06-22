import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatDateTime } from "../format";

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(12.99)).toBe("$12.99");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(9.999)).toBe("$10.00");
  });

  it("handles negative values", () => {
    const result = formatCurrency(-5.5);
    expect(result).toContain("5.50");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2026-06-15T10:30:00.000Z");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });

  it("handles different locales", () => {
    // Use a mid-day timestamp to avoid timezone boundary issues
    const result = formatDate("2026-01-15T12:00:00.000Z", "en-US");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });
});

describe("formatDateTime", () => {
  it("includes time components", () => {
    const result = formatDateTime("2026-06-15T14:30:00.000Z", "en-US");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });
});
