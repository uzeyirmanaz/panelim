import { PanelShell } from '@/components/panel/panel-shell'
import { BRAND } from '@/config/brand'

export const metadata = { title: `Panel | ${BRAND.name}` }

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>
}
