'use client'

// Rapor sayfaları ortak çerçevesi — tarih aralığı seçici + tablo (orijinal rapor düzeni)
import { useState } from 'react'

export function ReportFrame({
  title,
  icon,
  children,
  actions,
}: {
  title: string
  icon: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="p-4 pt-4">
      <div className="ads-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebedf0] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fdecec] text-[#c92c2c]">
              <i className="material-icons" style={{ fontSize: 19 }}>{icon}</i>
            </span>
            <h2 className="text-[16px] font-semibold text-[#303030]">{title}</h2>
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
        {children}
      </div>
    </div>
  )
}

export function DateRangePicker({
  from, to, onChange,
}: {
  from: string
  to: string
  onChange: (v: { from: string; to: string }) => void
}) {
  const quick = (days: number) => {
    const d = new Date()
    const start = new Date(d)
    start.setDate(d.getDate() - (days - 1))
    onChange({ from: start.toISOString().slice(0, 10), to: d.toISOString().slice(0, 10) })
  }
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => quick(1)} className={`h-9 rounded-lg px-3 text-[12.5px] font-medium ${from === today && to === today ? 'bg-[#fdecec] text-[#c92c2c]' : 'bg-[#f5f5f5] text-[#454545] hover:bg-[#eee]'}`}>Bugün</button>
      <button type="button" onClick={() => quick(7)} className="h-9 rounded-lg bg-[#f5f5f5] px-3 text-[12.5px] font-medium text-[#454545] hover:bg-[#eee]">Son 7 Gün</button>
      <button type="button" onClick={() => quick(30)} className="h-9 rounded-lg bg-[#f5f5f5] px-3 text-[12.5px] font-medium text-[#454545] hover:bg-[#eee]">Son 30 Gün</button>
      <span className="mx-1 h-5 w-px bg-[#ebedf0]" />
      <input type="date" value={from} onChange={(e) => onChange({ from: e.target.value, to })} style={{ width: 150 }} className="ads-input h-9 text-[13px]" />
      <span className="text-neutral-400">—</span>
      <input type="date" value={to} onChange={(e) => onChange({ from, to: e.target.value })} style={{ width: 150 }} className="ads-input h-9 text-[13px]" />
    </div>
  )
}
