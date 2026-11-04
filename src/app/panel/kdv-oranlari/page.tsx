'use client'

import { DefinitionPage } from '@/components/panel/definition-page'

export default function KdvOranlariPage() {
  return (
    <DefinitionPage
      endpoint="/api/vat-rates"
      singular="Kdv Oranı"
      emptyIcon="receipt_long"
      emptyText="Kayıt bulunamadı!"
      columns={[
        { key: 'rate', label: 'Oran', format: (r) => <span className="font-semibold text-[#303030]">%{Number(r.rate).toLocaleString('tr-TR')}</span> },
      ]}
      fields={[
        { key: 'rate', label: 'Oran (%)', type: 'number', required: true, placeholder: 'Örn: 10' },
      ]}
    />
  )
}
