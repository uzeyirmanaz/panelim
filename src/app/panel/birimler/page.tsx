'use client'

import { DefinitionPage } from '@/components/panel/definition-page'

export default function BirimlerPage() {
  return (
    <DefinitionPage
      endpoint="/api/units"
      singular="Birim"
      emptyIcon="library_books"
      emptyText="Kayıt bulunamadı!"
      columns={[
        { key: 'name', label: 'Birim Adı' },
        { key: 'sortOrder', label: 'Sıra', width: '100px' },
      ]}
      fields={[
        { key: 'name', label: 'Birim Adı', required: true, placeholder: 'Örn: Adet, Porsiyon, Kg' },
        { key: 'sortOrder', label: 'Sıra', type: 'number', defaultValue: 0 },
      ]}
    />
  )
}
