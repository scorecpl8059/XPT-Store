import type { Metadata } from "next";
import { inter } from "@/lib/fonts";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "XPT-TECH Store | Electronic Components",
    template: "%s | XPT-TECH Store",
  },
  description:
    "Premium electronic components for makers, engineers, and businesses. Microcontrollers, sensors, cables, and more.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://store.xpt-tech.com"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            {children}
            <ScrollToTop />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
