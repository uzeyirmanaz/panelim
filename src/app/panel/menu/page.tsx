import { AdminManage } from '@/components/pos/admin-manage'

import { BRAND } from '@/config/brand'

export const metadata = { title: `Menü Yönetimi | ${BRAND.name}` }

export default function PanelMenuPage() {
  return <AdminManage />
}
