import { Zen_Maru_Gothic, Plus_Jakarta_Sans, Klee_One } from "next/font/google";

// Rounded, warm display face for headings. Japanese-capable → preload false.
export const display = Zen_Maru_Gothic({
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: false,
  fallback: ["ui-rounded", "Hiragino Maru Gothic ProN", "system-ui", "sans-serif"],
});

// Body + UI font.
export const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

// Pencil / handwritten accent. Japanese-capable → preload false.
export const hand = Klee_One({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
  preload: false,
  fallback: ["ui-rounded", "Comic Sans MS", "cursive"],
});