import { Inter } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Orbitron for cyberpunk headings - loaded from Google Fonts via CSS
// Share Tech Mono for prices/codes - loaded from Google Fonts via CSS
// We use next/font for Inter (body) and CSS @font-face for display fonts
// to avoid loading heavy display fonts on every page

export const fontVariables = `${inter.variable}`;
