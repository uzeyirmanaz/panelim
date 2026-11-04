'use client'

import { DefinitionPage, money, dateTr } from '@/components/panel/definition-page'

export default function OdenmezlerPage() {
  return (
    <DefinitionPage
      endpoint="/api/odenmezler"
      singular="Ödenmez"
      emptyIcon="badge"
      emptyText="Kayıt bulunamadı!"
      columns={[
        { key: 'name', label: 'Ad Soyad' },
        { key: 'tableName', label: 'Masa', width: '110px' },
        { key: 'amount', label: 'Tutar', width: '140px', format: (r) => <span className="font-semibold text-[#c92c2c]">{money(r.amount)}</span> },
        {
          key: 'resolved', label: 'Durum', width: '120px',
          format: (r) => (
            <span className="ads-chip" style={{ background: r.resolved ? '#e8f5e9' : '#fdecec', color: r.resolved ? '#2e7d32' : '#c92c2c' }}>
              {r.resolved ? 'Tahsil Edildi' : 'Bekliyor'}
            </span>
          ),
        },
        { key: 'createdAt', label: 'Tarih', width: '170px', format: (r) => <span className="text-neutral-500">{dateTr(r.createdAt)}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Ad Soyad', required: true },
        { key: 'tableName', label: 'Masa' },
        { key: 'amount', label: 'Tutar (₺)', type: 'number', required: true },
        { key: 'note', label: 'Not', type: 'textarea' },
      ]}
    />
  )
}
