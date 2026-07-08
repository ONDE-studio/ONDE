import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Fraunces, Geist } from "next/font/google"
import "./globals.css"
import { StoreProvider } from "@/lib/store"
import { I18nProvider } from "@/lib/i18n"
import { CartUIProvider } from "@/components/cart-ui"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
})

export const metadata: Metadata = {
  title: "ONDE — Premium 3D Printing Studio",
  description:
    "ONDE — студия премиальной 3D-печати. Штучные вазы, свет, арт-объекты и функциональные детали ручной работы.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f6f3",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`light bg-background ${geist.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        <I18nProvider>
          <StoreProvider>
            <CartUIProvider>{children}</CartUIProvider>
          </StoreProvider>
        </I18nProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
