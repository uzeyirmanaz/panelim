'use client'

// Entegrasyon İşlemleri — bağlanabilir servisler listesi (orijinal kart düzeni)
import { useState } from 'react'

const INTEGRATIONS = [
  { name: 'Yemeksepeti', icon: 'delivery_dining', color: '#c92c2c', bg: '#fdecec', desc: 'Yemeksepeti siparişlerinizi panelinize alın.', connected: false },
  { name: 'Getir', icon: 'shopping_bag', color: '#5d3ebc', bg: '#f1ecfb', desc: 'GetirYemek siparişlerini anlık takip edin.', connected: false },
  { name: 'Trendyol Yemek', icon: 'local_mall', color: '#f27a1a', bg: '#fff2e5', desc: 'Trendyol yemek siparişlerini entegre edin.', connected: false },
  { name: 'Migros Yemek', icon: 'storefront', color: '#f27a1a', bg: '#fff2e5', desc: 'Migros Yemek siparişlerinizi yönetin.', connected: false },
  { name: 'Steam', icon: 'point_of_sale', color: '#0056A8', bg: '#ebf6ff', desc: 'Fiziksel POS cihazlarınızı bağlayın.', connected: false },
  { name: 'e-Fatura', icon: 'receipt', color: '#2e7d32', bg: '#e8f5e9', desc: 'e-Arşiv / e-Fatura kesim entegrasyonu.', connected: false },
  { name: 'Kurye Çağır', icon: 'two_wheeler', color: '#443200', bg: '#f3e2ae', desc: 'Anlık kurye çağırma servisi.', connected: false },
  { name: 'Muhasebe', icon: 'account_balance', color: '#454545', bg: '#f5f5f5', desc: 'Logo, Paraşüt ve benzeri muhasebe programları.', connected: false },
]

export default function EntegrasyonPage() {
  const [connected, setConnected] = useState<Record<string, boolean>>({})

  return (
    <div className="p-4 pt-4">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="new-menu shadowPulse">Yeni</span>
        <h2 className="text-[16px] font-semibold text-[#303030]">Entegrasyon İşlemleri</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {INTEGRATIONS.map((it) => {
          const on = connected[it.name]
          return (
            <div key={it.name} className="ads-card" style={{ gap: 10 }}>
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: it.bg, color: it.color }}>
                  <i className="material-icons" style={{ fontSize: 22 }}>{it.icon}</i>
                </span>
                <span className="ads-chip" style={{ background: on ? '#e8f5e9' : '#f5f5f5', color: on ? '#2e7d32' : '#a0a0a0' }}>
                  {on ? 'Bağlı' : 'Bağlı Değil'}
                </span>
              </div>
              <div>
                <h3 className="text-[14.5px] font-semibold text-[#303030]">{it.name}</h3>
                <p className="mt-0.5 text-[12.5px] leading-snug text-neutral-400">{it.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setConnected((p) => ({ ...p, [it.name]: !p[it.name] }))}
                className={on ? 'h-9 rounded-lg border border-[#d9d9d9] bg-white text-[13px] font-medium text-[#454545] hover:bg-neutral-50' : 'btn-theme h-9 text-[13px]'}
              >
                {on ? 'Bağlantıyı Kes' : 'Bağlan'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
