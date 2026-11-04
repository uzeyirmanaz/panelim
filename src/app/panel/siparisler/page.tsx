import { OrdersListView } from '@/components/panel/orders-list-view'

import { BRAND } from '@/config/brand'

export const metadata = { title: `Siparişler | ${BRAND.name}` }

export default function PanelSiparislerPage() {
  return <OrdersListView />
}
