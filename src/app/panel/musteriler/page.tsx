'use client'

import { DefinitionPage, dateTr } from '@/components/panel/definition-page'

export default function MusterilerPage() {
  return (
    <DefinitionPage
      endpoint="/api/customers"
      singular="Müşteri"
      emptyIcon="assignment_ind"
      emptyText="Kayıt bulunamadı!"
      columns={[
        { key: 'name', label: 'Ad Soyad' },
        { key: 'phone', label: 'Telefon', width: '160px' },
        { key: 'address', label: 'Adres' },
        { key: 'createdAt', label: 'Kayıt Tarihi', width: '170px', format: (r) => <span className="text-neutral-500">{dateTr(r.createdAt)}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Ad Soyad', required: true },
        { key: 'phone', label: 'Telefon', placeholder: '05xx xxx xx xx' },
        { key: 'address', label: 'Adres', type: 'textarea' },
        { key: 'note', label: 'Not', type: 'textarea' },
      ]}
    />
  )
}
