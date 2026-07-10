import type { Metadata } from "next";
import "./globals.css";

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
  return (
    <html lang="en">
      <body className="font-shell">{children}</body>
    </html>
  );
}
