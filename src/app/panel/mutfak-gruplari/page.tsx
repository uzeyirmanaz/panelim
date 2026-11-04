'use client'

import { DefinitionPage } from '@/components/panel/definition-page'

export default function MutfakGruplariPage() {
  return (
    <DefinitionPage
      endpoint="/api/kitchen-groups"
      singular="Mutfak Grubu"
      emptyIcon="dvr"
      emptyText="Kayıt bulunamadı!"
      columns={[{ key: 'name', label: 'Grup Adı' }]}
      fields={[{ key: 'name', label: 'Grup Adı', required: true, placeholder: 'Örn: Sıcak Mutfak, Soğuk Bar, Fırın' }]}
    />
  )
}
