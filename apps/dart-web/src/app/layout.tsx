import tokens from "@purrphect/ui/tokens";
import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { Cat } from "@/components/cat";
import { REPO_URL, SUPPORT_EMAIL } from "@/links";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

const description = "A cute darts scorer for big groups. Up to 12 players, a cat that calls your checkout, and stats.";

export const metadata: Metadata = {
  metadataBase: new URL("https://dart.purrphect.com"),
  title: { default: "Dart Purrphect", template: "%s · Dart Purrphect" },
  description,
  icons: { icon: "/icon.png", apple: "/apple-touch-icon.png" },
  openGraph: { title: "Dart Purrphect", description, url: "/", siteName: "Dart Purrphect", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: `hsl(${tokens.light.background})` },
    { media: "(prefers-color-scheme: dark)", color: `hsl(${tokens.dark.background})` },
  ],
};

const NAV_LINK = "rounded-lg px-3 py-2 text-foreground/70 transition-colors hover:text-foreground";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="flex min-h-dvh flex-col">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 rounded-lg font-extrabold text-lg">
            <Cat size={32} />
            Dart Purrphect
          </Link>
          <nav aria-label="Main" className="-mr-3 flex items-center text-sm">
            <Link href="/#features" className={`${NAV_LINK} hidden sm:block`}>
              Features
            </Link>
            <Link href="/#screenshots" className={`${NAV_LINK} hidden sm:block`}>
              Screenshots
            </Link>
            <a href={REPO_URL} className={NAV_LINK}>
              GitHub
            </a>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-8 pb-10 text-foreground/70 text-sm sm:px-6">
          <p>Dart Purrphect is open source under the MIT license.</p>
          <nav aria-label="Footer" className="-mx-3 flex">
            <Link href="/privacy" className={NAV_LINK}>
              Privacy
            </Link>
            <Link href="/imprint" className={NAV_LINK}>
              Imprint
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={NAV_LINK}>
              Support
            </a>
            <a href={REPO_URL} className={NAV_LINK}>
              GitHub
            </a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
