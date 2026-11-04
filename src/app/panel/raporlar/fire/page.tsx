'use client'

// Fire Raporu — zayi kayıtlarının özeti
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { money } from '@/components/panel/definition-page'

type Waste = { id: string; name: string; quantity: number; unit: string; amount: number; reason: string | null; wastedAt: string }

export default function FireRaporuPage() {
  const [rows, setRows] = useState<Waste[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Waste[]>('/api/wastes').then((d) => setRows(d ?? [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const total = useMemo(() => rows.reduce((s, r) => s + Number(r.amount), 0), [rows])
  const grouped = useMemo(() => {
    const m = new Map<string, { quantity: number; amount: number; unit: string }>()
    for (const r of rows) {
      const cur = m.get(r.name) ?? { quantity: 0, amount: 0, unit: r.unit }
      cur.quantity += Number(r.quantity)
      cur.amount += Number(r.amount)
      m.set(r.name, cur)
    }
    return Array.from(m.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount)
  }, [rows])

  return (
    <div className="p-4 pt-4">
      <div className="ads-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebedf0] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fdecec] text-[#c92c2c]">
              <i className="material-icons" style={{ fontSize: 19 }}>inventory_2</i>
            </span>
            <h2 className="text-[16px] font-semibold text-[#303030]">Fire Raporu</h2>
          </div>
          <span className="ads-chip" style={{ background: '#fdecec', color: '#c92c2c' }}>Toplam Fire: {money(total)}</span>
        </div>
        {loading ? (
          <p className="px-5 py-10 text-center text-[13px] text-neutral-400">Yükleniyor...</p>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-neutral-300">
            <i className="material-icons" style={{ fontSize: 44 }}>inventory_2</i>
            <p className="text-[14px] font-medium text-neutral-400">Kayıtlı fire bulunamadı!</p>
          </div>
        ) : (
          <div className="scroll-style overflow-auto px-5 pb-4 pt-4">
            <table className="ads-table">
              <thead>
                <tr><th style={{ width: '40%' }}>Ürün</th><th style={{ width: '20%' }}>Miktar</th><th style={{ width: '20%' }}>Tutar</th><th style={{ width: '20%' }}>Adet Kayıt</th></tr>
              </thead>
              <tbody>
                {grouped.map((g) => (
                  <tr key={g.name} className="hover:bg-[#fafafa]">
                    <td className="text-[13.5px] font-medium text-[#303030]">{g.name}</td>
                    <td>{g.quantity.toLocaleString('tr-TR')} {g.unit}</td>
                    <td className="font-semibold text-[#c92c2c]">{money(g.amount)}</td>
                    <td>{rows.filter((r) => r.name === g.name).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
