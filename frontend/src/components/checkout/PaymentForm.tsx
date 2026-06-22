"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { WsButton } from "@/components/ui/cyber-button";

interface PaymentFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  processing: boolean;
  setProcessing: (v: boolean) => void;
}

export function PaymentForm({
  onSuccess,
  onError,
  processing,
  setProcessing,
}: PaymentFormProps) {
  const t = useTranslations("checkout");
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      onError(result.error.message || t("paymentFailed"));
      setProcessing(false);
    } else if (
      result.paymentIntent?.status === "succeeded" ||
      result.paymentIntent?.status === "processing"
    ) {
      onSuccess();
    } else {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-sm font-semibold text-ws-text">{t("payment")}</h2>
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <WsButton
        type="submit"
        variant="primary"
        className="w-full"
        disabled={!stripe || processing}
      >
        {processing ? t("processing") : t("placeOrder")}
      </WsButton>
    </form>
  );
}
