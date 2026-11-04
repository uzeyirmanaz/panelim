import { MasalarView } from '@/components/panel/masalar-view'
import { BRAND } from '@/config/brand'

export const metadata = { title: `Masa / Bölgeler | ${BRAND.name}` }

export default function PanelMasalarPage() {
  return <MasalarView />
}
