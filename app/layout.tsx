import type { Metadata, Viewport } from "next"
import "../src/index.css"
import { weddingConfig } from "../src/config"

export const metadata: Metadata = {
  metadataBase: new URL(weddingConfig.siteUrl),
  title: `${weddingConfig.couple.english} | 24 January 2027`,
  description: `Wedding invitation of ${weddingConfig.couple.english} — 24 January 2027 at Guruvayur Sri Krishna Temple.`,
  alternates: { canonical: weddingConfig.siteUrl },
  openGraph: {
    type: "website",
    url: weddingConfig.siteUrl,
    siteName: `${weddingConfig.couple.english} Wedding Invitation`,
    locale: "ml_IN",
    title: `${weddingConfig.couple.english} — Wedding Invitation`,
    description: "Join our wedding on 24 January 2027 at Guruvayur Temple and reception on 26 January in Payyoli.",
    images: [{ url: "/assets/couple/previ.jpeg", width: 1076, height: 1599, alt: `${weddingConfig.couple.english} together`, type: "image/jpeg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${weddingConfig.couple.english} — Wedding Invitation`,
    description: "24 January 2027 · Guruvayur Temple. Reception: 26 January · Payyoli.",
    images: [new URL("assets/couple/previ.jpeg", weddingConfig.siteUrl).href],
  },
}

export const viewport: Viewport = { themeColor: "#061831" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ml"><body>{children}</body></html>
}
