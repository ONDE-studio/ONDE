import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { CartDrawer } from "./cart-drawer"

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
    </div>
  )
}
