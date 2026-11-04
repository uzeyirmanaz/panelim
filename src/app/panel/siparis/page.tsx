import { Suspense } from 'react'
import { OrderScreen } from '@/components/panel/order-screen'

import { BRAND } from '@/config/brand'

export const metadata = { title: `Sipariş | ${BRAND.name}` }

// ?masa=<masa-kimliği> | 'paket' | 'gelal' — statik export uyumlu sorgu parametresi
export default function PanelSiparisPage() {
  return (
    <Suspense>
      <OrderScreen />
    </Suspense>
  )
}
