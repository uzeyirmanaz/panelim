'use client'

import { DefinitionPage } from '@/components/panel/definition-page'

export default function SiparisTanimlariPage() {
  return (
    <DefinitionPage
      endpoint="/api/discounts"
      singular="Sipariş Tanımı"
      emptyIcon="shopping_basket"
      emptyText="Kayıt bulunamadı!"
      columns={[{ key: 'name', label: 'Tanım Adı' }]}
      fields={[{ key: 'name', label: 'Tanım Adı', required: true, placeholder: 'Örn: Servis Notu, Paket Notu' }]}
    />
  )
}
