'use client'

// Uygulama Mağazası — kurulabilir modüller (orijinal mağaza düzeni)
import { useState } from 'react'

const APPS = [
  { name: 'Online Rezervasyon', icon: 'event_available', color: '#0056A8', bg: '#ebf6ff', desc: 'Müşterileriniz web sitenizden masa rezervasyonu yapsın.', price: 'Ücretsiz' },
  { name: 'Adisyon Yazdırma', icon: 'print', color: '#454545', bg: '#f5f5f5', desc: 'Fiş ve mutfak yazıcılarına otomatik adisyon gönderimi.', price: 'Ücretsiz' },
  { name: 'Sadakat Programı', icon: 'loyalty', color: '#c92c2c', bg: '#fdecec', desc: 'Puan kazandır, indirim tanımla, müşterini geri getir.', price: 'Ücretsiz' },
  { name: 'Stok Takibi', icon: 'inventory', color: '#2e7d32', bg: '#e8f5e9', desc: 'Tarif kartı ile otomatik stok düşümü yap.', price: 'Ücretsiz' },
  { name: 'Personel Puanlama', icon: 'leaderboard', color: '#f27a1a', bg: '#fff2e5', desc: 'Garson performansını raporla, hedef belirle.', price: 'Ücretsiz' },
  { name: 'Çoklu Şube', icon: 'store', color: '#5d3ebc', bg: '#f1ecfb', desc: 'Tüm şubelerini tek panelden yönet.', price: 'Ücretsiz' },
  { name: 'Müşteri Ekranı', icon: 'tv', color: '#443200', bg: '#f3e2ae', desc: 'Kasada müşteriye dönük sipariş göstergesi.', price: 'Ücretsiz' },
  { name: 'Mutfak Ekranı (KDS)', icon: 'soup_kitchen', color: '#c92c2c', bg: '#fdecec', desc: 'Mutfakta dokunmatik sipariş ekranı.', price: 'Ücretsiz' },
]

export default function UygulamaMagazasiPage() {
  const [installed, setInstalled] = useState<Record<string, boolean>>({ 'Mutfak Ekranı (KDS)': true, 'Adisyon Yazdırma': true })

  return (
    <div className="p-4 pt-4">
      <div className="mb-4">
        <h2 className="text-[16px] font-semibold text-[#303030]">Uygulama Mağazası</h2>
        <p className="text-[12.5px] text-neutral-400">İşletmenize özel modülleri kurun, paneliniz güçlendirin</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {APPS.map((app) => {
          const on = installed[app.name]
          return (
            <div key={app.name} className="ads-card" style={{ gap: 10 }}>
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: app.bg, color: app.color }}>
                  <i className="material-icons" style={{ fontSize: 22 }}>{app.icon}</i>
                </span>
                <span className="ads-chip" style={{ background: '#e8f5e9', color: '#2e7d32' }}>{app.price}</span>
              </div>
              <div>
                <h3 className="text-[14.5px] font-semibold text-[#303030]">{app.name}</h3>
                <p className="mt-0.5 text-[12.5px] leading-snug text-neutral-400">{app.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setInstalled((p) => ({ ...p, [app.name]: !p[app.name] }))}
                className={on ? 'h-9 rounded-lg border border-[#d9d9d9] bg-white text-[13px] font-medium text-[#454545] hover:bg-neutral-50' : 'btn-theme h-9 text-[13px]'}
              >
                {on ? 'Kaldır' : 'Kur'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
