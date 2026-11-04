'use client'

// Tavsiye Et ve Kazan — davet bağlantısı ve kazanç kartı
import { withBase } from '@/lib/utils'
import { useState } from 'react'

export default function TavsiyeEtPage() {
  const [copied, setCopied] = useState(false)
  const link = typeof window !== 'undefined' ? `${window.location.origin}${withBase('/giris/')}?ref=84337` : withBase('/giris/') + '?ref=84337'

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* pano yok */ }
  }

  return (
    <div className="flex flex-col gap-5 p-4 pt-4">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="ads-card items-center text-center lg:col-span-2">
          <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: '#f3e2ae', color: '#443200' }}>
            <i className="material-icons" style={{ fontSize: 26 }}>card_giftcard</i>
          </span>
          <h2 className="text-[18px] font-semibold text-[#303030]">Tavsiye Et ve Kazan</h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-neutral-400">
            Sistemi arkadaşlarınıza tavsiye edin; her yeni kayıt olan işletme için
            <b className="text-[#303030]"> 1 aylık ücretsiz kullanım</b> kazanın.
          </p>
          <div className="flex w-full max-w-md gap-2">
            <input readOnly value={link} className="ads-input flex-1 text-[13px]" />
            <button type="button" onClick={copy} className="btn-theme h-10 px-5 text-[13px]">{copied ? 'Kopyalandı!' : 'Kopyala'}</button>
          </div>
        </section>
        <section className="ads-card">
          <h3 className="text-[15px] font-semibold text-[#303030]">Kazançlarınız</h3>
          <div className="rounded-xl bg-[#fdecec] p-4 text-center">
            <p className="text-[12px] text-[#c92c2c]">Toplam Kazanç</p>
            <p className="text-[26px] font-bold text-[#c92c2c]">0 gün</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-lg border border-[#ebedf0] px-3 py-2.5">
              <span className="text-[13px] text-[#303030]">Davet Edilen</span>
              <span className="text-[13.5px] font-semibold text-[#303030]">0 işletme</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#ebedf0] px-3 py-2.5">
              <span className="text-[13px] text-[#303030]">Kayıt Olan</span>
              <span className="text-[13.5px] font-semibold text-[#303030]">0 işletme</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
