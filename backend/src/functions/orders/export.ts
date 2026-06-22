import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAdmin, AuthError } from "../../lib/auth/middleware";
import { listAllOrders, listOrdersByStatus } from "../../lib/db/orders";
import { unauthorized, serverError } from "../../lib/utils/response";
import { SECURITY_HEADERS } from "../../lib/utils/security-headers";
import type { Order } from "../../types/order";

const CSV_HEADERS = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Content-Type": "text/csv",
  "Content-Disposition": "attachment; filename=orders.csv",
  ...SECURITY_HEADERS,
};

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function orderToCsvRow(order: Order): string {
  const fields = [
    order.orderNumber,
    order.createdAt,
    order.userId,
    order.status,
    order.items.length.toString(),
    order.subtotal.toFixed(2),
    order.shippingCost.toFixed(2),
    order.tax.toFixed(2),
    order.total.toFixed(2),
    order.trackingNumber || "",
  ];
  return fields.map(escapeCsvField).join(",");
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    requireAdmin(event);

    const status = event.queryStringParameters?.status;
    const from = event.queryStringParameters?.from;
    const to = event.queryStringParameters?.to;

    const result = status
      ? await listOrdersByStatus(status, { limit: 1000 })
      : await listAllOrders({ limit: 1000 });

    let orders = result.items;

    if (from) {
      orders = orders.filter((o) => o.createdAt >= from);
    }
    if (to) {
      orders = orders.filter((o) => o.createdAt <= to);
    }

    const header =
      "orderNumber,date,customer,status,items,subtotal,shipping,tax,total,trackingNumber";
    const rows = orders.map(orderToCsvRow);
    const csvString = [header, ...rows].join("\n");

    return {
      statusCode: 200,
      headers: CSV_HEADERS,
      body: csvString,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error exporting orders:", error);
    return serverError();
  }
}
