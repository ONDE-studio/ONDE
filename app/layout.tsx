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
  keywords: ["3d печать", "студия 3d печати", "напечатанная ваза", "дизайнерский декор", "3d принтер", "купить вазу", "сувениры на заказ", "печать на 3d принтере"],
  icons: {
    icon: [
      { url: "/icon.png?v=4", type: "image/png" },
      { url: "/icon.svg?v=4", type: "image/svg+xml" },
    ],
    shortcut: "/icon.png?v=4",
    apple: "/icon.png?v=4",
  },
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
