'use client'

import { DefinitionPage, money } from '@/components/panel/definition-page'

export default function OzelliklerPage() {
  return (
    <DefinitionPage
      endpoint="/api/features"
      singular="Özellik"
      emptyIcon="view_list"
      emptyText="Kayıt bulunamadı!"
      columns={[
        { key: 'name', label: 'Özellik Adı' },
        { key: 'price', label: 'Fiyat', width: '160px', format: (r) => <span className="font-semibold text-[#303030]">{money(r.price)}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Özellik Adı', required: true, placeholder: 'Örn: Ekstra Peynir' },
        { key: 'price', label: 'Fiyat (₺)', type: 'number', defaultValue: 0 },
      ]}
    />
  )
}
