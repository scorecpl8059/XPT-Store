"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AddressForm, type Address, type AddressFormData } from "@/components/checkout/AddressForm";
import { ShippingOptions } from "@/components/checkout/ShippingOptions";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { OrderReview } from "@/components/checkout/OrderReview";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel, WsTextarea } from "@/components/ui/cyber-input";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import type { Order } from "@/types/order";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface ProductInfo {
  name: string;
  image?: string;
  price: number;
}

type Step = "address" | "shipping" | "payment" | "confirmation";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const router = useRouter();
  const { user } = useAuth();
  const { items, clearCart } = useCart();

  const [step, setStep] = useState<Step>("address");
  const [shippingAddress, setShippingAddress] = useState<
    (Address | AddressFormData) | null
  >(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [poNumber, setPoNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [productInfoMap, setProductInfoMap] = useState<
    Record<string, ProductInfo>
  >({});

  // Fetch product info
  const fetchProductInfo = useCallback(async () => {
    const ids = [...new Set(items.map((i) => i.productId))];
    const toFetch = ids.filter((id) => !productInfoMap[id]);
    if (toFetch.length === 0) return;

    const results = await Promise.allSettled(
      toFetch.map((id) => api.get<Product>(`/products/${id}`))
    );

    const newMap = { ...productInfoMap };
    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value) {
        const p = result.value;
        newMap[toFetch[idx]] = {
          name: p.name,
          image: p.images?.[0],
          price: p.basePrice,
        };
      }
    });
    setProductInfoMap(newMap);
  }, [items, productInfoMap]);

  useEffect(() => {
    if (items.length > 0) fetchProductInfo();
  }, [items.length, fetchProductInfo]);

  const subtotal = items.reduce((sum, item) => {
    const info = productInfoMap[item.productId];
    return sum + (info?.price ?? 0) * item.quantity;
  }, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  // Redirect if not logged in or cart empty
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-ws-text-muted mb-3">
              {t("loginRequired")}
            </p>
            <Link href="/auth/login">
              <WsButton variant="primary">Sign In</WsButton>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0 && step !== "confirmation") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-ws-text-muted mb-3">
              {t("emptyCart")}
            </p>
            <Link href="/products">
              <WsButton variant="primary">{tc("back")}</WsButton>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddressSelect = (addr: Address | AddressFormData) => {
    setShippingAddress(addr);
  };

  const handleShippingSelect = (cost: number) => {
    setShippingCost(cost);
  };

  const handleCreateOrder = async () => {
    if (!shippingAddress) return;
    setProcessing(true);
    setError("");

    try {
      const addressId =
        "addressId" in shippingAddress ? shippingAddress.addressId : undefined;

      const body: Record<string, unknown> = {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shippingAddress: {
          recipientName: shippingAddress.recipientName,
          phone: "phone" in shippingAddress ? shippingAddress.phone : "",
          street1: shippingAddress.street1,
          street2: "street2" in shippingAddress ? shippingAddress.street2 : "",
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country,
        },
      };

      if (addressId) body.shippingAddressId = addressId;
      if (poNumber) body.poNumber = poNumber;
      if (notes) body.notes = notes;

      const result = await api.post<{
        order: Order;
        clientSecret: string;
      }>("/orders", body);

      setClientSecret(result.clientSecret);
      setOrderId(result.order.orderId);
      setOrderNumber(result.order.orderNumber);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("paymentFailed"));
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    await clearCart();
    setStep("confirmation");
  };

  const getAddressState = (): string => {
    if (!shippingAddress) return "";
    return shippingAddress.state;
  };

  const steps: Step[] = ["address", "shipping", "payment", "confirmation"];
  const currentIdx = steps.indexOf(step);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-bold text-ws-text mb-2">
            {t("title")}
          </h1>

          {/* Step indicator */}
          {step !== "confirmation" && (
            <div className="flex items-center gap-2 mb-8">
              {["address", "shipping", "payment"].map((s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      idx <= currentIdx
                        ? "bg-ws-blue text-white"
                        : "bg-ws-surface border border-ws-border text-ws-text-muted"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < 2 && (
                    <div
                      className={`h-px w-8 sm:w-16 ${
                        idx < currentIdx ? "bg-ws-blue" : "bg-ws-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Step: Address */}
          {step === "address" && (
            <WsCard>
              <WsCardContent className="space-y-6">
                <AddressForm
                  onSelect={handleAddressSelect}
                  selectedAddressId={
                    shippingAddress && "addressId" in shippingAddress
                      ? shippingAddress.addressId
                      : undefined
                  }
                />

                {/* PO Number & Notes */}
                <div className="border-t border-ws-border pt-4 space-y-3">
                  <div>
                    <WsLabel>{t("poNumber")}</WsLabel>
                    <WsInput
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <WsLabel>{t("orderNotes")}</WsLabel>
                    <WsTextarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <WsButton
                    variant="primary"
                    onClick={() => setStep("shipping")}
                    disabled={!shippingAddress}
                  >
                    {tc("next")}
                  </WsButton>
                </div>
              </WsCardContent>
            </WsCard>
          )}

          {/* Step: Shipping */}
          {step === "shipping" && (
            <WsCard>
              <WsCardContent className="space-y-6">
                <ShippingOptions
                  state={getAddressState()}
                  items={items}
                  onSelect={handleShippingSelect}
                />

                {/* Order review */}
                <OrderReview
                  items={items}
                  productInfoMap={productInfoMap}
                  subtotal={subtotal}
                  shippingCost={shippingCost}
                  tax={tax}
                  total={total}
                  shippingAddress={{
                    recipientName: shippingAddress?.recipientName || "",
                    street1: shippingAddress?.street1 || "",
                    city: shippingAddress?.city || "",
                    state: shippingAddress?.state || "",
                    zipCode: shippingAddress?.zipCode || "",
                  }}
                  poNumber={poNumber}
                  notes={notes}
                />

                <div className="flex justify-between">
                  <WsButton
                    variant="secondary"
                    onClick={() => setStep("address")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {tc("back")}
                  </WsButton>
                  <WsButton
                    variant="primary"
                    onClick={handleCreateOrder}
                    disabled={processing}
                  >
                    {processing ? t("processing") : t("placeOrder")}
                  </WsButton>
                </div>
              </WsCardContent>
            </WsCard>
          )}

          {/* Step: Payment */}
          {step === "payment" && clientSecret && (
            <WsCard>
              <WsCardContent>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        colorPrimary: "#2563eb",
                      },
                    },
                  }}
                >
                  <PaymentForm
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => setError(msg)}
                    processing={processing}
                    setProcessing={setProcessing}
                  />
                </Elements>
              </WsCardContent>
            </WsCard>
          )}

          {/* Step: Confirmation */}
          {step === "confirmation" && (
            <WsCard>
              <WsCardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-ws-green mx-auto mb-4" />
                <h2 className="text-lg font-bold text-ws-text mb-2">
                  {t("orderPlaced")}
                </h2>
                <p className="text-sm text-ws-text-secondary mb-1">
                  {t("orderConfirmation")}
                </p>
                {orderNumber && (
                  <p className="text-sm text-ws-text-muted mb-6">
                    Order #{orderNumber}
                  </p>
                )}
                <div className="flex gap-3 justify-center">
                  <Link href={`/account/orders/${orderId}` as any}>
                    <WsButton variant="primary">{t("viewOrder")}</WsButton>
                  </Link>
                  <Link href="/products">
                    <WsButton variant="secondary">{tc("back")}</WsButton>
                  </Link>
                </div>
              </WsCardContent>
            </WsCard>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
