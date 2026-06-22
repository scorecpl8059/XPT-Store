const BRAND_COLOR = "#4F46E5";
const ACCENT_COLOR = "#2563EB";
const STORE_NAME = "XPT-TECH";
const STORE_URL = process.env.FRONTEND_URL || "https://store.xpt-tech.com";

function layout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F8F8FC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FC;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #E2E0F0;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:${BRAND_COLOR};padding:24px 32px;">
          <a href="${STORE_URL}" style="color:#ffffff;text-decoration:none;font-size:20px;font-weight:bold;letter-spacing:-0.5px;">${STORE_NAME}</a>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #E2E0F0;background:#F8F8FC;">
          <p style="margin:0;font-size:12px;color:#8E89A8;text-align:center;">
            &copy; ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.<br>
            <a href="${STORE_URL}" style="color:${ACCENT_COLOR};text-decoration:none;">store.xpt-tech.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background:${ACCENT_COLOR};border-radius:6px;padding:12px 24px;">
      <a href="${url}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">${text}</a>
    </td></tr>
  </table>`;
}

// -- Templates --

export function orderConfirmationEmail(data: {
  customerName: string;
  orderNumber: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  shipping: number;
  total: number;
}): { subject: string; html: string } {
  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #E2E0F0;font-size:14px;color:#1E1B3A;">${item.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E2E0F0;font-size:14px;color:#4B4669;text-align:center;">×${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E2E0F0;font-size:14px;color:#1E1B3A;text-align:right;">$${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const content = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1E1B3A;">Order Confirmed</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#4B4669;">Hi ${data.customerName}, thank you for your order!</p>
    <p style="margin:0 0 16px;font-size:14px;color:#4B4669;">Order: <strong style="color:#1E1B3A;">${data.orderNumber}</strong></p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <th style="padding:8px 0;border-bottom:2px solid #E2E0F0;font-size:12px;color:#8E89A8;text-align:left;text-transform:uppercase;">Item</th>
        <th style="padding:8px 0;border-bottom:2px solid #E2E0F0;font-size:12px;color:#8E89A8;text-align:center;text-transform:uppercase;">Qty</th>
        <th style="padding:8px 0;border-bottom:2px solid #E2E0F0;font-size:12px;color:#8E89A8;text-align:right;text-transform:uppercase;">Price</th>
      </tr>
      ${itemRows}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;font-size:14px;color:#4B4669;">Subtotal</td><td style="text-align:right;font-size:14px;color:#1E1B3A;">$${data.subtotal.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#4B4669;">Shipping</td><td style="text-align:right;font-size:14px;color:#1E1B3A;">$${data.shipping.toFixed(2)}</td></tr>
      <tr><td style="padding:8px 0;font-size:16px;font-weight:bold;color:#1E1B3A;border-top:2px solid #E2E0F0;">Total</td><td style="text-align:right;padding:8px 0;font-size:16px;font-weight:bold;color:#1E1B3A;border-top:2px solid #E2E0F0;">$${data.total.toFixed(2)}</td></tr>
    </table>
    ${button("View Order", `${STORE_URL}/account/orders/${data.orderId}`)}
  `;

  return {
    subject: `Order Confirmed — ${data.orderNumber}`,
    html: layout("Order Confirmation", content),
  };
}

export function shippingNotificationEmail(data: {
  customerName: string;
  orderNumber: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1E1B3A;">Your Order Has Shipped!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#4B4669;">Hi ${data.customerName}, your order <strong>${data.orderNumber}</strong> is on its way.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FC;border-radius:8px;padding:16px;margin-bottom:16px;">
      <tr><td style="padding:8px;font-size:13px;color:#8E89A8;">Carrier</td><td style="padding:8px;font-size:14px;color:#1E1B3A;font-weight:500;">${data.carrier}</td></tr>
      <tr><td style="padding:8px;font-size:13px;color:#8E89A8;">Tracking #</td><td style="padding:8px;font-size:14px;color:#1E1B3A;font-family:monospace;">${data.trackingNumber}</td></tr>
    </table>
    ${data.trackingUrl ? button("Track Package", data.trackingUrl) : ""}
    ${button("View Order", `${STORE_URL}/account/orders/${data.orderId}`)}
  `;

  return {
    subject: `Shipped — ${data.orderNumber}`,
    html: layout("Shipping Notification", content),
  };
}

export function returnStatusEmail(data: {
  customerName: string;
  returnId: string;
  orderNumber: string;
  status: "approved" | "rejected" | "refunded";
  message?: string;
}): { subject: string; html: string } {
  const statusText =
    data.status === "approved"
      ? "Your return request has been approved."
      : data.status === "refunded"
        ? "Your refund has been processed."
        : "Your return request was not approved.";

  const content = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1E1B3A;">Return Update</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#4B4669;">Hi ${data.customerName},</p>
    <p style="margin:0 0 16px;font-size:14px;color:#4B4669;">${statusText}</p>
    <p style="margin:0 0 8px;font-size:13px;color:#8E89A8;">Order: ${data.orderNumber}</p>
    ${data.message ? `<p style="margin:16px 0;padding:12px;background:#F8F8FC;border-radius:6px;font-size:14px;color:#4B4669;">${data.message}</p>` : ""}
    ${button("View Details", `${STORE_URL}/account/returns`)}
  `;

  return {
    subject: `Return ${data.status.charAt(0).toUpperCase() + data.status.slice(1)} — ${data.orderNumber}`,
    html: layout("Return Update", content),
  };
}

export function passwordResetEmail(data: {
  name: string;
  resetUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1E1B3A;">Reset Your Password</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#4B4669;">Hi ${data.name}, we received a request to reset your password.</p>
    ${button("Reset Password", data.resetUrl)}
    <p style="margin:0;font-size:12px;color:#8E89A8;">If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>
  `;

  return {
    subject: "Reset Your Password",
    html: layout("Password Reset", content),
  };
}

export function welcomeEmail(data: {
  name: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1E1B3A;">Welcome to ${STORE_NAME}!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#4B4669;">Hi ${data.name}, your account is ready. Start exploring our catalog of electronic components.</p>
    ${button("Browse Products", `${STORE_URL}/products`)}
  `;

  return {
    subject: `Welcome to ${STORE_NAME}`,
    html: layout("Welcome", content),
  };
}

export function lowStockAlertEmail(data: {
  products: Array<{ name: string; sku: string; stock: number }>;
}): { subject: string; html: string } {
  const rows = data.products
    .map(
      (p) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #E2E0F0;font-size:14px;color:#1E1B3A;">${p.name}</td>
          <td style="padding:8px;border-bottom:1px solid #E2E0F0;font-size:13px;color:#8E89A8;font-family:monospace;">${p.sku}</td>
          <td style="padding:8px;border-bottom:1px solid #E2E0F0;font-size:14px;color:#dc2626;font-weight:600;text-align:right;">${p.stock}</td>
        </tr>`
    )
    .join("");

  const content = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1E1B3A;">Low Stock Alert</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#4B4669;">The following products are running low on stock:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th style="padding:8px;border-bottom:2px solid #E2E0F0;font-size:12px;color:#8E89A8;text-align:left;text-transform:uppercase;">Product</th>
        <th style="padding:8px;border-bottom:2px solid #E2E0F0;font-size:12px;color:#8E89A8;text-align:left;text-transform:uppercase;">SKU</th>
        <th style="padding:8px;border-bottom:2px solid #E2E0F0;font-size:12px;color:#8E89A8;text-align:right;text-transform:uppercase;">Stock</th>
      </tr>
      ${rows}
    </table>
    ${button("Manage Inventory", `${STORE_URL}/admin/inventory`)}
  `;

  return {
    subject: `Low Stock Alert — ${data.products.length} product(s)`,
    html: layout("Low Stock Alert", content),
  };
}

export function newOrderAlertEmail(data: {
  orderNumber: string;
  orderId: string;
  customerName: string;
  total: number;
  itemCount: number;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:20px;color:#1E1B3A;">New Order Received</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8FC;border-radius:8px;padding:16px;margin:16px 0;">
      <tr><td style="padding:8px;font-size:13px;color:#8E89A8;">Order</td><td style="padding:8px;font-size:14px;color:#1E1B3A;font-weight:600;">${data.orderNumber}</td></tr>
      <tr><td style="padding:8px;font-size:13px;color:#8E89A8;">Customer</td><td style="padding:8px;font-size:14px;color:#1E1B3A;">${data.customerName}</td></tr>
      <tr><td style="padding:8px;font-size:13px;color:#8E89A8;">Items</td><td style="padding:8px;font-size:14px;color:#1E1B3A;">${data.itemCount}</td></tr>
      <tr><td style="padding:8px;font-size:13px;color:#8E89A8;">Total</td><td style="padding:8px;font-size:16px;color:#1E1B3A;font-weight:bold;">$${data.total.toFixed(2)}</td></tr>
    </table>
    ${button("View Order", `${STORE_URL}/admin/orders/${data.orderId}`)}
  `;

  return {
    subject: `New Order — ${data.orderNumber} ($${data.total.toFixed(2)})`,
    html: layout("New Order", content),
  };
}
