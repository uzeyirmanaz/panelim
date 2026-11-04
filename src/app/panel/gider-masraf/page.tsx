'use client'

import { DefinitionPage, money, dateTr } from '@/components/panel/definition-page'

export default function GiderMasrafPage() {
  return (
    <DefinitionPage
      endpoint="/api/expenses"
      singular="Gider / Masraf"
      emptyIcon="trending_down"
      emptyText="Kayıt bulunamadı!"
      columns={[
        { key: 'name', label: 'Gider Adı' },
        {
          key: 'category', label: 'Kategori', width: '140px',
          format: (r) => <span className="ads-chip" style={{ background: '#f5f5f5', color: '#454545' }}>{String(r.category)}</span>,
        },
        { key: 'amount', label: 'Tutar', width: '140px', format: (r) => <span className="font-semibold text-[#303030]">{money(r.amount)}</span> },
        { key: 'spentAt', label: 'Tarih', width: '170px', format: (r) => <span className="text-neutral-500">{dateTr(r.spentAt)}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Gider Adı', required: true, placeholder: 'Örn: Kira, Elektrik, Personel' },
        { key: 'category', label: 'Kategori', type: 'select', options: [
          { value: 'Kira', label: 'Kira' }, { value: 'Personel', label: 'Personel' },
          { value: 'Elektrik-Su-Dogalgaz', label: 'Elektrik / Su / Doğalgaz' },
          { value: 'Malzeme', label: 'Malzeme' }, { value: 'Diğer', label: 'Diğer' },
        ] },
        { key: 'amount', label: 'Tutar (₺)', type: 'number', required: true },
        { key: 'spentAt', label: 'Tarih', type: 'date' },
        { key: 'note', label: 'Not', type: 'textarea' },
      ]}
    />
  )
}
