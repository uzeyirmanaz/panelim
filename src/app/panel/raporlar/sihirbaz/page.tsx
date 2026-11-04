'use client'

// Rapor Sihirbazı — adım adım rapor oluşturma (orijinal sihirbaz düzeni)
import { useState } from 'react'
import Link from 'next/link'

const STEPS = [
  {
    title: 'Rapor türünü seçin',
    options: [
      { label: 'Ürün Satış Raporu', desc: 'Ürün bazlı satış adedi ve cirosu', href: '/panel/raporlar/urun-satis', icon: 'show_chart' },
      { label: 'Gün Sonu Raporu', desc: 'Gün bazlı ciro ve sipariş özeti', href: '/panel/raporlar/gun-sonu', icon: 'monetization_on' },
      { label: 'Vardiya Satış Raporu', desc: 'Vardiyalara göre satış dağılımı', href: '/panel/raporlar/vardiya', icon: 'request_quote' },
    ],
  },
  {
    title: 'Detay raporlar',
    options: [
      { label: 'Restaurant İstatistikleri', desc: 'Bölge ve sipariş tipi dağılımı', href: '/panel/raporlar/istatistik', icon: 'query_stats' },
      { label: 'Fire Raporu', desc: 'Zayi kayıtlarının özeti', href: '/panel/raporlar/fire', icon: 'inventory_2' },
      { label: 'Maliyet-Karlılık Raporu', desc: 'Kategori bazlı ciro payı', href: '/panel/raporlar/maliyet', icon: 'trending_up' },
    ],
  },
]

export default function RaporSihirbaziPage() {
  const [step, setStep] = useState(0)

  return (
    <div className="p-4 pt-4">
      <div className="ads-card">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#303030]">Rapor Sihirbazı</h2>
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <span key={i} className="h-2 w-8 rounded-full transition-colors" style={{ background: i <= step ? '#c92c2c' : '#f3f4f6' }} />
            ))}
          </div>
        </div>
        <p className="text-[13px] text-neutral-400">Adım {step + 1}/{STEPS.length} — {STEPS[step].title}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STEPS[step].options.map((o) => (
            <Link key={o.label} href={o.href} className="group flex flex-col gap-2 rounded-xl border border-[#ebedf0] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.15)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fdecec] text-[#c92c2c]">
                <i className="material-icons" style={{ fontSize: 20 }}>{o.icon}</i>
              </span>
              <span className="text-[13.5px] font-semibold text-[#303030]">{o.label}</span>
              <span className="text-[12px] leading-snug text-neutral-400">{o.desc}</span>
            </Link>
          ))}
        </div>
        <div className="flex justify-between">
          <button type="button" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className="h-10 rounded-lg border border-[#d9d9d9] bg-white px-4 text-[13.5px] font-medium text-[#454545] hover:bg-neutral-50 disabled:opacity-40">
            Geri
          </button>
          <button type="button" disabled={step === STEPS.length - 1} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} className="btn-theme h-10 px-5 text-[13.5px] disabled:opacity-40">
            İleri
          </button>
        </div>
      </div>
    </div>
  )
}
