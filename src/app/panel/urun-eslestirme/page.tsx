'use client'

// Ürün Eşleştirme Ekranı — entegrasyon ürünlerini menü ürünleriyle eşleştirme
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { money } from '@/components/panel/definition-page'

type Product = { id: string; name: string; price: number; category: { name: string } }

export default function UrunEslestirmePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get<Product[]>('/api/products').then((d) => setProducts(d ?? [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter((p) => p.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')))

  return (
    <div className="p-4 pt-4">
      <div className="ads-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebedf0] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fdecec] text-[#c92c2c]">
              <i className="material-icons" style={{ fontSize: 19 }}>room_service</i>
            </span>
            <div>
              <h2 className="text-[16px] font-semibold text-[#303030]">Ürün Eşleştirme Ekranı</h2>
              <p className="text-[12px] text-neutral-400">Entegrasyon ürünlerini menünüzdeki ürünlerle eşleştirin</p>
            </div>
          </div>
          <div className="relative">
            <i className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-neutral-400">search</i>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün ara..." style={{ width: 220 }} className="ads-input pl-8" />
          </div>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-center text-[13px] text-neutral-400">Yükleniyor...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-neutral-300">
            <i className="material-icons" style={{ fontSize: 44 }}>room_service</i>
            <p className="text-[14px] font-medium text-neutral-400">Eşleştirilecek ürün bulunamadı!</p>
            <p className="text-[12.5px] text-neutral-400">Önce Menü / Ürünler ekranından ürün tanımlayın.</p>
          </div>
        ) : (
          <div className="scroll-style overflow-auto">
            <table className="ads-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Menü Ürünü</th>
                  <th style={{ width: '20%' }}>Kategori</th>
                  <th style={{ width: '15%' }}>Fiyat</th>
                  <th style={{ width: '30%' }}>Entegrasyon Durumu</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fafafa]">
                    <td className="text-[13.5px] font-medium text-[#303030]">{p.name}</td>
                    <td><span className="ads-chip" style={{ background: '#f5f5f5', color: '#454545' }}>{p.category?.name ?? '—'}</span></td>
                    <td className="font-semibold text-[#303030]">{money(p.price)}</td>
                    <td>
                      <span className="ads-chip" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                        <i className="material-icons" style={{ fontSize: 13, marginRight: 4 }}>check</i> Eşleştirildi
                      </span>
                    </td>
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
