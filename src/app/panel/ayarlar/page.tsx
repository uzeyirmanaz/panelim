import { SettingsView } from '@/components/panel/settings-view'

import { BRAND } from '@/config/brand'

export const metadata = { title: `Ayarlar | ${BRAND.name}` }

export default function PanelAyarlarPage() {
  return <SettingsView />
}
