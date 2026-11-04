'use client'

import { DefinitionPage, money } from '@/components/panel/definition-page'

export default function IndirimlerPage() {
  return (
    <DefinitionPage
      endpoint="/api/discounts"
      singular="İndirim"
      emptyIcon="label"
      emptyText="Kayıt bulunamadı!"
      columns={[
        { key: 'name', label: 'İndirim Adı' },
        {
          key: 'type', label: 'Tür', width: '130px',
          format: (r) => (
            <span className="ads-chip" style={{ background: r.type === 'percent' ? '#ebf6ff' : '#f3e2ae', color: r.type === 'percent' ? '#0056A8' : '#443200' }}>
              {r.type === 'percent' ? 'Yüzde' : 'Tutar'}
            </span>
          ),
        },
        { key: 'value', label: 'Değer', width: '130px', format: (r) => <span className="font-semibold text-[#303030]">{r.type === 'percent' ? `%${Number(r.value).toLocaleString('tr-TR')}` : money(r.value)}</span> },
      ]}
      fields={[
        { key: 'name', label: 'İndirim Adı', required: true, placeholder: 'Örn: Öğrenci İndirimi' },
        { key: 'type', label: 'Tür', type: 'select', options: [{ value: 'percent', label: 'Yüzde (%)' }, { value: 'amount', label: 'Tutar (₺)' }] },
        { key: 'value', label: 'Değer', type: 'number', required: true },
      ]}
    />
  )
}
