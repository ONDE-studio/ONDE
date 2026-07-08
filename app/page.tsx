import { StoreShell } from "@/components/store-shell"
import { Hero } from "@/components/hero"
import { Catalog } from "@/components/catalog"
import { ProcessSection } from "@/components/process-section"
import { AboutContact } from "@/components/about-contact"

export default function Page() {
  return (
    <StoreShell>
      <Hero />
      <Catalog />
      <ProcessSection />
      <AboutContact />
    </StoreShell>
  )
}
