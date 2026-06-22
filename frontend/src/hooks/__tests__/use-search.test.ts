import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock api
vi.mock("@/lib/api", () => ({
  api: { get: vi.fn() },
}));

// Mock useDebounce to return value immediately (no delay)
vi.mock("../use-debounce", () => ({
  useDebounce: (value: unknown) => value,
}));

import { api } from "@/lib/api";
const mockGet = vi.mocked(api.get);

import { useSearch } from "../use-search";

describe("useSearch", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("returns null results and not loading for empty query", () => {
    const { result } = renderHook(() => useSearch(""));
    expect(result.current.results).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("returns null results for query shorter than 2 characters", () => {
    const { result } = renderHook(() => useSearch("a"));
    expect(result.current.results).toBeNull();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("calls api.get with query param", async () => {
    const searchResult = {
      items: [{ productId: "p1", name: "Test", description: "", categoryId: "c1", basePrice: 10, score: 1 }],
      total: 1,
      page: 1,
      size: 10,
    };
    mockGet.mockResolvedValue(searchResult as any);

    const { result } = renderHook(() => useSearch("arduino"));

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/search", { q: "arduino" });
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(searchResult);
      expect(result.current.loading).toBe(false);
    });
  });

  it("passes filter options as params", async () => {
    mockGet.mockResolvedValue({ items: [], total: 0, page: 1, size: 10 } as any);

    renderHook(() =>
      useSearch("test", {
        categoryId: "cat-1",
        minPrice: 10,
        maxPrice: 100,
        page: 2,
        size: 20,
      })
    );

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/search", {
        q: "test",
        categoryId: "cat-1",
        minPrice: "10",
        maxPrice: "100",
        page: "2",
        size: "20",
      });
    });
  });

  it("sets results to null on api error", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSearch("arduino"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.results).toBeNull();
  });

  it("returns the debounced query", () => {
    const { result } = renderHook(() => useSearch("arduino"));
    expect(result.current.query).toBe("arduino");
  });
});
