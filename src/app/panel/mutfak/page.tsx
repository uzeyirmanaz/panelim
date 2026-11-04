import { PanelKitchenView } from '@/components/panel/kitchen-view'

import { BRAND } from '@/config/brand'

export const metadata = { title: `Mutfak | ${BRAND.name}` }

export default function PanelMutfakPage() {
  return <PanelKitchenView />
}
