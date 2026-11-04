import type { Metadata, Viewport } from "next"
import "../src/index.css"

export const metadata: Metadata = {
  title: "Sreekesh & Karthika | 24 January 2027",
  description: "Wedding invitation of Sreekesh and Karthika — 24 January 2027 at Guruvayur Sri Krishna Temple.",
}

export const viewport: Viewport = { themeColor: "#101d42" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ml"><body>{children}</body></html>
}
