import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

const sans = Manrope({ variable: "--font-sans", subsets: ["latin"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_URL ||
      process.env.PROOFSMITH_PRODUCTION_URL ||
      "https://proofsmith.vercel.app",
  ),
  title: "Proofsmith — Issue in. Verified PR out.",
  description:
    "A GitHub-native autonomous engineering loop that stops only when independent evidence proves the issue is resolved.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Proofsmith — Issue in. Verified PR out.",
    description: "Independent evidence closes the engineering loop.",
    images: [{ url: "/og.png", width: 1733, height: 909, alt: "Proofsmith — Issue in. Verified PR out." }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>;
}
