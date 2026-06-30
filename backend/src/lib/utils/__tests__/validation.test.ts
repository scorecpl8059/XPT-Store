import { describe, it, expect } from "vitest";
import {
  createUserSchema,
  passwordSchema,
  updateUserSchema,
  createAddressSchema,
  createProductSchema,
  createVariantSchema,
  createCategorySchema,
  createOrderSchema,
  createReviewSchema,
  createReturnSchema,
  createRfqSchema,
  createPageSchema,
  createShippingZoneSchema,
  contactSchema,
} from "../validation";

describe("passwordSchema", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("Ab1!xyz");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without uppercase", () => {
    const result = passwordSchema.safeParse("abcdefg1!");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without lowercase", () => {
    const result = passwordSchema.safeParse("ABCDEFG1!");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without a number", () => {
    const result = passwordSchema.safeParse("Abcdefgh!");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without a special character", () => {
    const result = passwordSchema.safeParse("Abcdefg1");
    expect(result.success).toBe(false);
  });

  it("accepts valid strong passwords", () => {
    const result = passwordSchema.safeParse("MyP@ssw0rd");
    expect(result.success).toBe(true);
  });
});

describe("createUserSchema", () => {
  it("accepts valid individual user", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      name: "John Doe",
      password: "MyP@ssw0rd",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid business user", () => {
    const result = createUserSchema.safeParse({
      email: "biz@example.com",
      name: "Jane",
      accountType: "business",
      companyName: "Acme Corp",
      taxId: "12-3456789",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = createUserSchema.safeParse({
      email: "not-an-email",
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid auth provider", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      name: "Test",
      authProvider: "facebook",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  it("accepts partial updates", () => {
    const result = updateUserSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts language update", () => {
    const result = updateUserSchema.safeParse({ preferredLanguage: "zh-CN" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid language", () => {
    const result = updateUserSchema.safeParse({ preferredLanguage: "fr" });
    expect(result.success).toBe(false);
  });
});

describe("createAddressSchema", () => {
  const validAddress = {
    recipientName: "John Doe",
    phone: "555-1234",
    street1: "123 Main St",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
  };

  it("accepts valid address", () => {
    expect(createAddressSchema.safeParse(validAddress).success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const { recipientName, ...missing } = validAddress;
    expect(createAddressSchema.safeParse(missing).success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createAddressSchema.safeParse({
      ...validAddress,
      label: "Home",
      street2: "Apt 4B",
      country: "US",
      isDefault: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("createProductSchema", () => {
  const validProduct = {
    name: "ESP32 Module",
    description: "A WiFi + BLE microcontroller",
    categoryId: "cat-123",
    basePrice: 12.99,
    weight: 0.1,
  };

  it("accepts valid product", () => {
    expect(createProductSchema.safeParse(validProduct).success).toBe(true);
  });

  it("rejects negative price", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      basePrice: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero price", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      basePrice: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts product with variants", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      hasVariants: true,
      variantTypes: [{ name: "Color", values: ["Red", "Blue"] }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts product with dimensions", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      dimensions: { length: 10, width: 5, height: 2 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects product with invalid status", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      status: "deleted",
    });
    expect(result.success).toBe(false);
  });
});

describe("createVariantSchema", () => {
  it("accepts valid variant", () => {
    const result = createVariantSchema.safeParse({
      sku: "ESP32-RED",
      attributes: { color: "Red" },
      price: 14.99,
      stock: 100,
      weight: 0.1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing SKU", () => {
    const result = createVariantSchema.safeParse({
      attributes: { color: "Red" },
      price: 14.99,
      stock: 100,
      weight: 0.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative stock", () => {
    const result = createVariantSchema.safeParse({
      sku: "ESP32-RED",
      attributes: {},
      price: 14.99,
      stock: -1,
      weight: 0.1,
    });
    expect(result.success).toBe(false);
  });
});

describe("createCategorySchema", () => {
  it("accepts valid category", () => {
    const result = createCategorySchema.safeParse({
      name: "Microcontrollers",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with optional fields", () => {
    const result = createCategorySchema.safeParse({
      name: "Sensors",
      slug: "sensors",
      description: "Temperature, humidity, motion sensors",
      parentId: "cat-parent",
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(createCategorySchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = createCategorySchema.safeParse({
      name: "Test",
      status: "deleted",
    });
    expect(result.success).toBe(false);
  });
});

describe("createOrderSchema", () => {
  it("accepts valid order", () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: "prod-1", quantity: 2 }],
      shippingAddressId: "addr-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty items", () => {
    const result = createOrderSchema.safeParse({
      items: [],
      shippingAddressId: "addr-1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero quantity", () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: "prod-1", quantity: 0 }],
      shippingAddressId: "addr-1",
    });
    expect(result.success).toBe(false);
  });

  it("accepts PO number and notes", () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: "prod-1", quantity: 1 }],
      shippingAddressId: "addr-1",
      poNumber: "PO-2026-001",
      notes: "Please ship ASAP",
    });
    expect(result.success).toBe(true);
  });
});

describe("createReviewSchema", () => {
  it("accepts valid review", () => {
    const result = createReviewSchema.safeParse({
      productId: "prod-1",
      rating: 5,
      title: "Great product",
      comment: "Works perfectly!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects rating out of range", () => {
    expect(
      createReviewSchema.safeParse({
        productId: "prod-1",
        rating: 0,
        title: "Bad",
        comment: "Terrible",
      }).success
    ).toBe(false);

    expect(
      createReviewSchema.safeParse({
        productId: "prod-1",
        rating: 6,
        title: "Too good",
        comment: "Impossible",
      }).success
    ).toBe(false);
  });

  it("limits images to 5", () => {
    const result = createReviewSchema.safeParse({
      productId: "prod-1",
      rating: 4,
      title: "Test",
      comment: "Test",
      images: [
        "https://a.com/1.jpg",
        "https://a.com/2.jpg",
        "https://a.com/3.jpg",
        "https://a.com/4.jpg",
        "https://a.com/5.jpg",
        "https://a.com/6.jpg",
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("createReturnSchema", () => {
  it("accepts valid return", () => {
    const result = createReturnSchema.safeParse({
      orderId: "ord-1",
      items: [{ productId: "prod-1", quantity: 1 }],
      reason: "Item defective",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing reason", () => {
    const result = createReturnSchema.safeParse({
      orderId: "ord-1",
      items: [{ productId: "prod-1", quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("createRfqSchema", () => {
  it("accepts valid RFQ", () => {
    const result = createRfqSchema.safeParse({
      items: [{ productId: "prod-1", quantity: 1000 }],
      message: "Need bulk pricing",
    });
    expect(result.success).toBe(true);
  });
});

describe("createPageSchema", () => {
  it("accepts valid page", () => {
    const result = createPageSchema.safeParse({
      title: "Terms of Service",
      content: "<p>Terms go here</p>",
      type: "legal",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid page type", () => {
    const result = createPageSchema.safeParse({
      title: "Test",
      content: "Content",
      type: "blog",
    });
    expect(result.success).toBe(false);
  });
});

describe("createShippingZoneSchema", () => {
  it("accepts valid zone", () => {
    const result = createShippingZoneSchema.safeParse({
      name: "East Coast",
      states: ["NY", "NJ", "CT"],
      rates: [{ minWeight: 0, maxWeight: 5, price: 9.99 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty states", () => {
    const result = createShippingZoneSchema.safeParse({
      name: "Test",
      states: [],
      rates: [{ minWeight: 0, maxWeight: 5, price: 9.99 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty rates", () => {
    const result = createShippingZoneSchema.safeParse({
      name: "Test",
      states: ["NY"],
      rates: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("accepts valid contact form", () => {
    const result = contactSchema.safeParse({
      name: "John",
      email: "john@example.com",
      subject: "Question about products",
      message: "Do you ship internationally?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = contactSchema.safeParse({
      name: "John",
      email: "not-email",
      subject: "Test",
      message: "Test",
    });
    expect(result.success).toBe(false);
  });
});
