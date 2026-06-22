import { describe, it, expect } from "vitest";
import {
  orderConfirmationEmail,
  shippingNotificationEmail,
  returnStatusEmail,
  passwordResetEmail,
  welcomeEmail,
  lowStockAlertEmail,
  newOrderAlertEmail,
} from "../templates";

describe("orderConfirmationEmail", () => {
  const data = {
    customerName: "John Doe",
    orderNumber: "XPT-20260601-0001",
    orderId: "ord-1",
    items: [
      { name: "ESP32 Module", quantity: 2, price: 12.99 },
      { name: "USB-C Cable", quantity: 1, price: 5.99 },
    ],
    subtotal: 31.97,
    shipping: 9.99,
    total: 41.96,
  };

  it("generates subject with order number", () => {
    const { subject } = orderConfirmationEmail(data);
    expect(subject).toContain("XPT-20260601-0001");
    expect(subject).toContain("Confirmed");
  });

  it("generates HTML with customer name", () => {
    const { html } = orderConfirmationEmail(data);
    expect(html).toContain("John Doe");
  });

  it("includes item names", () => {
    const { html } = orderConfirmationEmail(data);
    expect(html).toContain("ESP32 Module");
    expect(html).toContain("USB-C Cable");
  });

  it("includes totals", () => {
    const { html } = orderConfirmationEmail(data);
    expect(html).toContain("$41.96");
    expect(html).toContain("$9.99");
  });

  it("includes order link", () => {
    const { html } = orderConfirmationEmail(data);
    expect(html).toContain("/account/orders/ord-1");
  });

  it("is valid HTML", () => {
    const { html } = orderConfirmationEmail(data);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });
});

describe("shippingNotificationEmail", () => {
  it("includes carrier and tracking number", () => {
    const { html, subject } = shippingNotificationEmail({
      customerName: "Jane",
      orderNumber: "XPT-001",
      orderId: "ord-1",
      carrier: "UPS",
      trackingNumber: "1Z999AA10123456784",
      trackingUrl: "https://ups.com/track/1Z999AA10123456784",
    });
    expect(html).toContain("UPS");
    expect(html).toContain("1Z999AA10123456784");
    expect(html).toContain("Track Package");
    expect(subject).toContain("Shipped");
  });
});

describe("returnStatusEmail", () => {
  it("generates approved status email", () => {
    const { html } = returnStatusEmail({
      customerName: "Bob",
      returnId: "ret-1",
      orderNumber: "XPT-001",
      status: "approved",
    });
    expect(html).toContain("approved");
    expect(html).toContain("Bob");
  });

  it("generates rejected status email", () => {
    const { html } = returnStatusEmail({
      customerName: "Bob",
      returnId: "ret-1",
      orderNumber: "XPT-001",
      status: "rejected",
      message: "Item was used and cannot be returned",
    });
    expect(html).toContain("not approved");
    expect(html).toContain("Item was used");
  });

  it("generates refunded status email", () => {
    const { html, subject } = returnStatusEmail({
      customerName: "Alice",
      returnId: "ret-2",
      orderNumber: "XPT-002",
      status: "refunded",
    });
    expect(html).toContain("refund has been processed");
    expect(subject).toContain("Refunded");
  });
});

describe("passwordResetEmail", () => {
  it("includes reset URL", () => {
    const { html, subject } = passwordResetEmail({
      name: "Test User",
      resetUrl: "https://store.xpt-tech.com/auth/reset?token=abc123",
    });
    expect(html).toContain("https://store.xpt-tech.com/auth/reset?token=abc123");
    expect(html).toContain("Test User");
    expect(subject).toContain("Reset");
  });

  it("includes expiry notice", () => {
    const { html } = passwordResetEmail({
      name: "User",
      resetUrl: "https://example.com/reset",
    });
    expect(html).toContain("1 hour");
  });
});

describe("welcomeEmail", () => {
  it("greets by name", () => {
    const { html, subject } = welcomeEmail({ name: "Alice" });
    expect(html).toContain("Alice");
    expect(subject).toContain("Welcome");
    expect(html).toContain("Browse Products");
  });
});

describe("lowStockAlertEmail", () => {
  it("lists products with low stock", () => {
    const { html, subject } = lowStockAlertEmail({
      products: [
        { name: "ESP32 Module", sku: "ESP32-001", stock: 3 },
        { name: "USB Cable", sku: "USB-C-01", stock: 1 },
      ],
    });
    expect(html).toContain("ESP32 Module");
    expect(html).toContain("ESP32-001");
    expect(html).toContain("USB Cable");
    expect(subject).toContain("2 product(s)");
  });
});

describe("newOrderAlertEmail", () => {
  it("includes order details", () => {
    const { html, subject } = newOrderAlertEmail({
      orderNumber: "XPT-20260601-0005",
      orderId: "ord-5",
      customerName: "Big Corp Inc",
      total: 1250.0,
      itemCount: 15,
    });
    expect(html).toContain("XPT-20260601-0005");
    expect(html).toContain("Big Corp Inc");
    expect(html).toContain("$1250.00");
    expect(html).toContain("15");
    expect(subject).toContain("$1250.00");
  });
});
