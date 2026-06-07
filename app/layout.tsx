import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
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
    default: "Chey Time — Hip Hop's Princess",
    template: "%s · Chey Time",
  },
  description:
    "Chey Time — Hip Hop's Princess. Staten Island rapper blending relatable lyricism with upbeat, captivating production. Step into Chey's Time: an interactive clock to stream music, shop merch, and catch live events.",
  keywords: [
    "Chey Time",
    "Chey",
    "Hip Hop's Princess",
    "Staten Island rapper",
    "hip hop",
    "music",
  ],
  authors: [{ name: "Chey" }],
  openGraph: {
    type: "profile",
    title: "Chey Time — Hip Hop's Princess",
    description:
      "Staten Island rapper. Step into Chey's Time — an interactive clock to stream music, shop merch, and catch live events.",
    siteName: "Chey Time",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chey Time — Hip Hop's Princess",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
