"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";

const labels: Record<Locale, string> = {
  en: "EN",
  "zh-CN": "中文",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            locale === l
              ? "text-ws-blue bg-ws-blue/10"
              : "text-ws-text-muted hover:text-ws-text-secondary"
          }`}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  );
}
