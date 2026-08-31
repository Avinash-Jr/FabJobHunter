import { LiveProvider } from "@/components/live-provider";
import { AppShell } from "@/components/app-shell";
import { CozyScene } from "@/components/scene/cozy-scene";
import { Toaster } from "@/components/ui/sonner";
import { getShellSnapshot } from "@/lib/data";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initial = await getShellSnapshot();

  return (
    <html lang="en">
      <body className={inter.className}>
        <CozyScene />
        <LiveProvider initial={initial}>
          <AppShell>{children}</AppShell>
        </LiveProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
