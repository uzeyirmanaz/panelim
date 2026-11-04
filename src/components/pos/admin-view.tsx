'use client'

import { AdminDashboard } from '@/components/pos/admin-dashboard'
import { AdminManage } from '@/components/pos/admin-manage'

export function AdminView() {
  return (
    <div className="space-y-4">
      <AdminDashboard />
      <AdminManage />
    </div>
  )
}
