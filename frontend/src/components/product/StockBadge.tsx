"use client";

import { useTranslations } from "next-intl";
import { WsBadge } from "@/components/ui/cyber-badge";

interface StockBadgeProps {
  stock: number;
  reserved?: number;
}

export function StockBadge({ stock, reserved = 0 }: StockBadgeProps) {
  const t = useTranslations("product");
  const available = stock - reserved;

  if (available <= 0) {
    return <WsBadge variant="red">{t("outOfStock")}</WsBadge>;
  }

  if (available <= 10) {
    return (
      <WsBadge variant="amber">
        {t("lowStock")} &middot; {t("remaining", { count: available })}
      </WsBadge>
    );
  }

  return <WsBadge variant="green">{t("inStock")}</WsBadge>;
}
