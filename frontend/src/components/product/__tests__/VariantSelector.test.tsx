import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VariantSelector } from "../VariantSelector";
import type { VariantType, Variant } from "@/types/product";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values)
      return Object.entries(values).reduce(
        (s, [k, v]) => s.replace(`{${k}}`, String(v)),
        `product.${key}`
      );
    return `product.${key}`;
  },
}));

const variantTypes: VariantType[] = [
  { name: "Color", values: ["Red", "Blue", "Green"] },
];

function makeVariant(attrs: Record<string, string>, stock = 10): Variant {
  return {
    productId: "p1",
    variantId: `v-${Object.values(attrs).join("-")}`,
    sku: `SKU-${Object.values(attrs).join("-")}`,
    attributes: attrs,
    price: 10,
    stock,
    reservedStock: 0,
    weight: 0.1,
    status: "active",
  };
}

describe("VariantSelector", () => {
  it("renders variant type labels", () => {
    render(
      <VariantSelector
        variantTypes={variantTypes}
        variants={[makeVariant({ Color: "Red" })]}
        selected={{}}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText("product.selectVariant")).toBeInTheDocument();
  });

  it("renders all values as buttons", () => {
    render(
      <VariantSelector
        variantTypes={variantTypes}
        variants={[
          makeVariant({ Color: "Red" }),
          makeVariant({ Color: "Blue" }),
          makeVariant({ Color: "Green" }),
        ]}
        selected={{}}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(screen.getByText("Green")).toBeInTheDocument();
  });

  it("highlights selected value", () => {
    render(
      <VariantSelector
        variantTypes={variantTypes}
        variants={[makeVariant({ Color: "Red" }), makeVariant({ Color: "Blue" })]}
        selected={{ Color: "Red" }}
        onSelect={() => {}}
      />
    );
    const redBtn = screen.getByText("Red");
    expect(redBtn.className).toContain("border-ws-blue");
  });

  it("calls onSelect when value is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <VariantSelector
        variantTypes={variantTypes}
        variants={[makeVariant({ Color: "Red" }), makeVariant({ Color: "Blue" })]}
        selected={{}}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByText("Blue"));
    expect(onSelect).toHaveBeenCalledWith("Color", "Blue");
  });

  it("disables out-of-stock values", () => {
    render(
      <VariantSelector
        variantTypes={variantTypes}
        variants={[
          makeVariant({ Color: "Red" }, 0),
          makeVariant({ Color: "Blue" }, 5),
        ]}
        selected={{}}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText("Red")).toBeDisabled();
    expect(screen.getByText("Blue")).not.toBeDisabled();
  });
});
