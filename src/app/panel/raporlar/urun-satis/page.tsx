'use client'

// Ürün Satış Raporu
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { money } from '@/components/panel/definition-page'
import { ReportFrame, DateRangePicker } from '@/components/panel/report-frame'

type Row = { name: string; quantity: number; revenue: number; category: string }
type Data = { rows: Row[]; totalRevenue: number; totalQty: number; orderCount: number }

export default function UrunSatisRaporuPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [range, setRange] = useState({ from: today, to: today })
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get<Data>(`/api/reports?type=urun-satis&from=${range.from}&to=${range.to}`)
      .then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [range])

  return (
    <ReportFrame
      title="Ürün Satış Raporu"
      icon="show_chart"
      actions={<DateRangePicker from={range.from} to={range.to} onChange={setRange} />}
    >
      {loading ? (
        <p className="px-5 py-10 text-center text-[13px] text-neutral-400">Yükleniyor...</p>
      ) : !data || data.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-neutral-300">
          <i className="material-icons" style={{ fontSize: 44 }}>show_chart</i>
          <p className="text-[14px] font-medium text-neutral-400">Seçilen tarihte satış bulunamadı!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 px-5 pt-4">
            <Sum label="Toplam Ciro" value={money(data.totalRevenue)} />
            <Sum label="Toplam Adet" value={data.totalQty.toLocaleString('tr-TR')} />
            <Sum label="Sipariş Sayısı" value={String(data.orderCount)} />
          </div>
          <div className="scroll-style overflow-auto px-5 pb-4 pt-3">
            <table className="ads-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Ürün</th>
                  <th style={{ width: '20%' }}>Kategori</th>
                  <th style={{ width: '15%' }}>Adet</th>
                  <th style={{ width: '15%' }}>Tutar</th>
                  <th style={{ width: '15%' }}>Payı</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.name} className="hover:bg-[#fafafa]">
                    <td className="text-[13.5px] font-medium text-[#303030]">{r.name}</td>
                    <td><span className="ads-chip" style={{ background: '#f5f5f5', color: '#454545' }}>{r.category}</span></td>
                    <td>{r.quantity.toLocaleString('tr-TR')}</td>
                    <td className="font-semibold text-[#303030]">{money(r.revenue)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#f3f4f6]">
                          <div className="h-full rounded-full bg-[#c92c2c]" style={{ width: `${data.totalRevenue ? (r.revenue / data.totalRevenue) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[12px] text-neutral-400">{data.totalRevenue ? Math.round((r.revenue / data.totalRevenue) * 100) : 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </ReportFrame>
  )
}

function Sum({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#ebedf0] px-4 py-3">
      <p className="text-[12px] text-[#303030] opacity-60">{label}</p>
      <p className="text-[18px] font-bold text-[#303030]">{value}</p>
    </div>
  )
}
