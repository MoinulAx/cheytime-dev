import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import CartIndicator from "@/components/CartIndicator";

const playfair = Playfair_Display({
  subsets: ["latin"],
  // 400 and 700 only. 900 was loaded in both styles and never used, two font
  // files preloaded for nothing, which is what the console flags as an unused
  // preload. Nothing in the design applies font-black.
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cheytime.com"),
  title: {
    default: "Chey Time: Hip Hop's Princess",
    template: "%s · Chey Time",
  },
  description:
    "Hip Hop's Princess out of Staten Island. Chey pairs relatable lyricism with upbeat, captivating production. Step into Chey's Time, an interactive clock built to stream the music, shop the merch and catch live dates.",
  keywords: [
    "Chey Time",
    "Chey",
    "Hip Hop's Princess",
    "Staten Island rapper",
    "hip hop",
    "music",
  ],
  authors: [{ name: "Chey" }],
  // Site design and build credit, surfaced in the page metadata as well as
  // in the footer credit on the dial.
  creator: "rummspace",
  publisher: "rummspace",
  openGraph: {
    type: "profile",
    title: "Chey Time, Hip Hop's Princess",
    description:
      "Staten Island rapper. Step into Chey's Time, an interactive clock built to stream the music, shop the merch and catch live dates.",
    siteName: "Chey Time",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chey Time, Hip Hop's Princess",
    description: "Staten Island rapper. Stream music, shop merch, catch live events.",
  },
};

export const viewport: Viewport = {
  themeColor: "#050208",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} dark`}>
      <body className="antialiased">
        {/* The basket wraps everything so it survives moving between the clock,
            the store pages and /cart. `children` is still passed through as a
            server-rendered subtree, the provider is a client boundary around
            it, not above it. */}
        <CartProvider>
          {children}
          <CartIndicator />
        </CartProvider>
      </body>
    </html>
  );
}
