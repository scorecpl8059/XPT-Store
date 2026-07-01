import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requireAuth, AuthError } from "../../lib/auth/middleware";
import { getAddresses } from "../../lib/db/addresses";
import { getProductById } from "../../lib/db/products";
import { getVariantsByProduct } from "../../lib/db/variants";
import { calculateShippingRate } from "../../lib/db/shipping";
import { createOrder } from "../../lib/db/orders";
import { stripe } from "../../lib/stripe/client";
import {
  created,
  badRequest,
  unauthorized,
  notFound,
  serverError, initCors } from "../../lib/utils/response";
import type { CreateOrderInput, OrderItem } from "../../types/order";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    initCors(event);
    const user = requireAuth(event);

    if (!event.body) {
      return badRequest("Request body is required");
    }

    const input = JSON.parse(event.body);

    if (!input.items || input.items.length === 0) {
      return badRequest("Order must contain at least one item");
    }

    // Support both shippingAddressId (saved) and inline shippingAddress (new)
    let shippingAddress: {
      recipientName: string;
      phone: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    let billingAddress: {
      recipientName: string;
      street1: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    } | undefined;

    if (input.shippingAddress) {
      // Inline address from checkout form
      shippingAddress = input.shippingAddress;
    } else if (input.shippingAddressId) {
      // Saved address lookup
      const addresses = await getAddresses(user.userId);
      const found = addresses.find(
        (a) => a.addressId === input.shippingAddressId
      );
      if (!found) {
        return notFound("Shipping address not found");
      }
      shippingAddress = found;

      if (input.billingAddressId) {
        const billing = addresses.find(
          (a) => a.addressId === input.billingAddressId
        );
        if (billing) {
          billingAddress = {
            recipientName: billing.recipientName,
            street1: billing.street1,
            city: billing.city,
            state: billing.state,
            zipCode: billing.zipCode,
            country: billing.country,
          };
        }
      }
    } else {
      return badRequest("Shipping address is required");
    }

    // Resolve each item: look up product and optional variant
    const resolvedItems: OrderItem[] = [];
    let subtotal = 0;
    let totalWeight = 0;

    for (const item of input.items) {
      const product = await getProductById(item.productId);
      if (!product) {
        return notFound(`Product not found: ${item.productId}`);
      }

      let price = product.basePrice;
      let sku = product.slug;
      let name = product.name;
      let image = product.images[0];
      let weight = product.weight || 0.5;

      if (item.variantId) {
        const variants = await getVariantsByProduct(item.productId);
        const variant = variants.find((v) => v.variantId === item.variantId);
        if (!variant) {
          return notFound(
            `Variant not found: ${item.variantId} for product ${item.productId}`
          );
        }
        price = variant.price;
        sku = variant.sku;
        weight = variant.weight || weight;
        if (variant.image) {
          image = variant.image;
        }
      }

      subtotal += price * item.quantity;
      totalWeight += weight * item.quantity;

      resolvedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name,
        sku,
        price,
        quantity: item.quantity,
        image,
      });
    }

    // Calculate shipping
    let shippingCost = 0;
    const shippingResult = await calculateShippingRate(
      shippingAddress.state,
      totalWeight
    );
    if (shippingResult) {
      shippingCost = shippingResult.rate.price;
    }

    // Tax: 8% flat rate
    const tax = Math.round(subtotal * 0.08 * 100) / 100;

    // Total
    const total = Math.round((subtotal + shippingCost + tax) * 100) / 100;

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: "usd",
      metadata: { userId: user.userId },
    });

    // Create the order
    const order = await createOrder({
      userId: user.userId,
      status: "processing",
      items: resolvedItems,
      subtotal,
      shippingCost,
      tax,
      total,
      shippingAddress: {
        recipientName: shippingAddress.recipientName,
        phone: shippingAddress.phone,
        street1: shippingAddress.street1,
        street2: shippingAddress.street2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country,
      },
      billingAddress: billingAddress
        ? {
            recipientName: billingAddress.recipientName,
            street1: billingAddress.street1,
            city: billingAddress.city,
            state: billingAddress.state,
            zipCode: billingAddress.zipCode,
            country: billingAddress.country,
          }
        : undefined,
      paymentIntentId: paymentIntent.id,
      poNumber: input.poNumber,
      notes: input.notes,
    });

    // Update PaymentIntent metadata with orderId for webhook lookup
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: { userId: user.userId, orderId: order.orderId },
    });

    return created({ order, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    console.error("Error creating order:", error);
    return serverError();
  }
}
