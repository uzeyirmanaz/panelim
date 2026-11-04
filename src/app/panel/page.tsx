import { AnasayfaView } from '@/components/panel/anasayfa-view'
import { BRAND } from '@/config/brand'

export const metadata = { title: `Ana Sayfa | ${BRAND.name}` }

export default function PanelHomePage() {
  return <AnasayfaView />
}
