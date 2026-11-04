'use client'

// Yetkiler sayfası — rollerin modül erişim matrisi (orijinal panel düzeni)
import { useState } from 'react'

type Perm = { key: string; label: string }

const MODULES: Perm[] = [
  { key: 'anasayfa', label: 'Ana Sayfa' },
  { key: 'masalar', label: 'Masa / Bölgeler' },
  { key: 'menu', label: 'Menü / Ürünler' },
  { key: 'siparis', label: 'Sipariş Açma' },
  { key: 'odeme', label: 'Ödeme Alma' },
  { key: 'indirim', label: 'İndirim Yapma' },
  { key: 'iptal', label: 'Sipariş İptali' },
  { key: 'tanimlamalar', label: 'Tanımlamalar' },
  { key: 'raporlar', label: 'Raporlar' },
  { key: 'kullanicilar', label: 'Kullanıcılar' },
  { key: 'gider', label: 'Gider / Zayi' },
]

const ROLES = [
  { key: 'admin', label: 'Yönetici', color: '#c92c2c' },
  { key: 'staff', label: 'Personel', color: '#0056A8' },
  { key: 'kitchen', label: 'Mutfak', color: '#2e7d32' },
]

// Varsayılan yetki matrisi
const DEFAULTS: Record<string, Record<string, boolean>> = {
  admin: Object.fromEntries(MODULES.map((m) => [m.key, true])),
  staff: Object.fromEntries(MODULES.map((m) => [m.key, ['anasayfa', 'masalar', 'siparis', 'odeme'].includes(m.key)])),
  kitchen: Object.fromEntries(MODULES.map((m) => [m.key, ['anasayfa', 'masalar'].includes(m.key)])),
}

export default function YetkilerPage() {
  const [matrix, setMatrix] = useState(DEFAULTS)
  const [saved, setSaved] = useState(false)

  function toggle(role: string, mod: string) {
    setMatrix((prev) => ({ ...prev, [role]: { ...prev[role], [mod]: !prev[role][mod] } }))
    setSaved(false)
  }

  return (
    <div className="p-4 pt-4">
      <div className="ads-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebedf0] px-5 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-[#303030]">Yetkiler</h2>
            <p className="text-[12px] text-neutral-400">Rollere göre modül erişim yetkileri</p>
          </div>
          <button type="button" className="ads-fab" onClick={() => setSaved(true)}>
            <i className="material-icons">save</i> Kaydet
          </button>
        </div>
        {saved && (
          <div className="flex items-center gap-2 border-b border-[#e8f5e9] bg-[#e8f5e9] px-5 py-2.5 text-[13px] text-[#2e7d32]">
            <i className="material-icons" style={{ fontSize: 18 }}>check_circle</i> Yetkiler kaydedildi.
          </div>
        )}
        <div className="scroll-style overflow-auto">
          <table className="ads-table">
            <thead>
              <tr>
                <th>Modül</th>
                {ROLES.map((r) => (
                  <th key={r.key} style={{ width: '140px', textAlign: 'center' }}>
                    <span className="ads-chip" style={{ background: `${r.color}14`, color: r.color }}>{r.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m.key} className="hover:bg-[#fafafa]">
                  <td className="text-[13.5px] font-medium text-[#303030]">{m.label}</td>
                  {ROLES.map((r) => (
                    <td key={r.key} style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => toggle(r.key, m.key)}
                        aria-label={`${m.label} - ${r.label}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                        style={{
                          background: matrix[r.key][m.key] ? '#e8f5e9' : '#f5f5f5',
                          color: matrix[r.key][m.key] ? '#2e7d32' : '#a0a0a0',
                        }}
                      >
                        <i className="material-icons" style={{ fontSize: 18 }}>
                          {matrix[r.key][m.key] ? 'check_box' : 'check_box_outline_blank'}
                        </i>
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
