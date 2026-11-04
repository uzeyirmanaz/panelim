'use client'

import { Badge } from '@/components/ui/badge'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/types'

const STYLES: Record<OrderStatus, string> = {
  new: 'bg-brand-100 text-brand-700 border-brand-200',
  preparing: 'bg-amber-100 text-amber-700 border-amber-200',
  ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  delivered: 'bg-stone-100 text-stone-600 border-stone-200',
  paid: 'bg-stone-100 text-stone-500 border-stone-200 line-through opacity-80',
}

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge variant="outline" className={`${STYLES[status]} ${className ?? ''}`}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  new: 'bg-brand-500',
  preparing: 'bg-amber-500',
  ready: 'bg-emerald-500',
  delivered: 'bg-stone-400',
  paid: 'bg-stone-400',
}
