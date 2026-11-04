'use client'

// Dijital Menü — QR kod ile paylaşım ekranı
import { withBase } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Category = { id: string; name: string }
type Product = { id: string; name: string; price: number; categoryId: string; emoji: string }

export default function DijitalMenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get<Category[]>('/api/categories').then(setCategories).catch(() => {})
    api.get<Product[]>('/api/products').then(setProducts).catch(() => {})
  }, [])

  const menuUrl = typeof window !== 'undefined' ? `${window.location.origin}${withBase('/menu/')}` : withBase('/menu/')

  async function copy() {
    try {
      await navigator.clipboard.writeText(menuUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* pano yok */ }
  }

  return (
    <div className="flex flex-col gap-5 p-4 pt-4">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* QR kartı */}
        <section className="ads-card items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f5e9] text-[#2e7d32]">
            <i className="material-icons" style={{ fontSize: 26 }}>vibration</i>
          </span>
          <h2 className="text-[16px] font-semibold text-[#303030]">Dijital Menü</h2>
          <p className="text-[13px] leading-relaxed text-neutral-400">
            QR kodunuzun bağlı olduğu menü: <b className="text-[#303030]">SEYİR CAFE</b>
          </p>
          <div className="rounded-xl border border-[#ebedf0] bg-white p-3">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(menuUrl)}`}
              alt="Dijital menü QR kodu"
              width={180}
              height={180}
            />
          </div>
          <p className="break-all text-[12px] text-neutral-400">{menuUrl}</p>
          <div className="flex w-full gap-2">
            <button type="button" onClick={copy} className="btn-theme h-10 flex-1 text-[13px]">
              {copied ? 'Kopyalandı!' : 'Bağlantıyı Kopyala'}
            </button>
            <a href={withBase('/menu/')} target="_blank" rel="noreferrer" className="flex h-10 items-center rounded-lg border border-[#d9d9d9] bg-white px-4 text-[13px] font-medium text-[#454545] hover:bg-neutral-50">
              Menüyü Aç
            </a>
          </div>
        </section>

        {/* Menü özeti */}
        <section className="ads-card lg:col-span-2">
          <h3 className="text-[15px] font-semibold text-[#303030]">Menü Özeti</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Mini label="Kategori" value={String(categories.length)} />
            <Mini label="Ürün" value={String(products.length)} />
            <Mini label="Dil" value="Türkçe" />
            <Mini label="Durum" value="Yayında" />
          </div>
          <h4 className="text-[13.5px] font-semibold text-[#303030]">Kategoriler</h4>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <p className="text-[13px] text-neutral-400">Kategori bulunamadı. Menü / Ürünler ekranından ekleyin.</p>
            ) : categories.map((c) => (
              <span key={c.id} className="ads-chip" style={{ background: '#fdecec', color: '#c92c2c' }}>{c.name}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#ebedf0] px-4 py-3">
      <p className="text-[12px] text-[#303030] opacity-60">{label}</p>
      <p className="text-[18px] font-bold text-[#303030]">{value}</p>
    </div>
  )
}
