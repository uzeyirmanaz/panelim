'use client'

import { DefinitionPage, money, dateTr } from '@/components/panel/definition-page'

export default function ZayiPage() {
  return (
    <DefinitionPage
      endpoint="/api/wastes"
      singular="Zayi"
      emptyIcon="broken_image"
      emptyText="Kayıt bulunamadı!"
      columns={[
        { key: 'name', label: 'Ürün' },
        { key: 'quantity', label: 'Miktar', width: '110px', format: (r) => `${Number(r.quantity).toLocaleString('tr-TR')} ${String(r.unit ?? '')}` },
        { key: 'amount', label: 'Tutar', width: '140px', format: (r) => <span className="font-semibold text-[#c92c2c]">{money(r.amount)}</span> },
        { key: 'reason', label: 'Gerekçe' },
        { key: 'wastedAt', label: 'Tarih', width: '170px', format: (r) => <span className="text-neutral-500">{dateTr(r.wastedAt)}</span> },
      ]}
      fields={[
        { key: 'name', label: 'Ürün', required: true, placeholder: 'Zayi olan ürün' },
        { key: 'quantity', label: 'Miktar', type: 'number', defaultValue: 1 },
        { key: 'unit', label: 'Birim', type: 'select', options: [
          { value: 'Adet', label: 'Adet' }, { value: 'Porsiyon', label: 'Porsiyon' }, { value: 'Kg', label: 'Kg' }, { value: 'Lt', label: 'Lt' },
        ] },
        { key: 'amount', label: 'Tutar (₺)', type: 'number' },
        { key: 'reason', label: 'Gerekçe', type: 'textarea', placeholder: 'Örn: Bozulma, Kırılma, Dökülme' },
        { key: 'wastedAt', label: 'Tarih', type: 'date' },
      ]}
    />
  )
}
