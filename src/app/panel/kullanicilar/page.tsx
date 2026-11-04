'use client'

// Kullanıcılar sayfası — orijinal paneldeki listeye bire bir sadık:
// people_outline başlık + "Kullanıcı Sayısı" özeti, Ekle butonu,
// No | Ad/Soyad | Email | No | Görev | Son Giriş tablosu.
// Firebase mimarisinde kullanıcılar davet kodu ile eklenir:
// yönetici kodu üretir, personel giriş sayfasından kodla kaydolur.
import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Plus, RefreshCw } from 'lucide-react'

import { useAuth } from '@/lib/firebase/auth-context'
import { davetKodlariServis, kullaniciProfilleriServis } from '@/lib/firebase/services'
import type { DavetKodu, KullaniciProfili } from '@/lib/firebase/tipler'

const ROLE_OPTIONS: Array<{ value: KullaniciProfili['role']; label: string }> = [
  { value: 'yonetici', label: 'Yönetici' },
  { value: 'garson', label: 'Garson' },
  { value: 'kasa', label: 'Kasa' },
  { value: 'mutfak', label: 'Mutfak' },
]

const ROLE_LABEL: Record<string, { label: string; bg: string; fg: string }> = {
  admin: { label: 'Yönetici', bg: '#fdecec', fg: '#c92c2c' },
  yonetici: { label: 'Yönetici', bg: '#fdecec', fg: '#c92c2c' },
  garson: { label: 'Garson', bg: '#ebf6ff', fg: '#0056A8' },
  kasa: { label: 'Kasa', bg: '#f3e8fd', fg: '#7b1fa2' },
  mutfak: { label: 'Mutfak', bg: '#e8f5e9', fg: '#2e7d32' },
}

export default function KullanicilarPage() {
  const { profil } = useAuth()
  const [rows, setRows] = useState<KullaniciProfili[]>([])
  const [davetler, setDavetler] = useState<DavetKodu[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [rol, setRol] = useState<KullaniciProfili['role']>('garson')
  const [uretilen, setUretilen] = useState<string | null>(null)
  const [kopyalandi, setKopyalandi] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [k, d] = await Promise.all([kullaniciProfilleriServis.hepsiniGetir(), davetKodlariServis.hepsiniGetir()])
      setRows(k)
      setDavetler(d)
    } catch {
      /* sessiz */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function davetOlustur() {
    setSaving(true)
    try {
      // 6 haneli okunabilir kod üret (karışan harfler hariç)
      const kod = Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('')
      await davetKodlariServis.ekle({
        code: kod,
        role: rol,
        kullanildi: false,
        olusturan: profil?.name ?? '',
      })
      setUretilen(kod)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function davetSil(d: DavetKodu) {
    if (!window.confirm(`"${d.code}" kodunu silmek istediğinize emin misiniz?`)) return
    await davetKodlariServis.sil(d.id)
    await load()
  }

  function kopyala(kod: string) {
    navigator.clipboard?.writeText(kod).then(() => {
      setKopyalandi(true)
      setTimeout(() => setKopyalandi(false), 1500)
    })
  }

  function tarih(v: unknown): string {
    if (!v) return '—'
    const d =
      typeof v === 'object' && v !== null && 'toDate' in (v as object)
        ? (v as { toDate(): Date }).toDate()
        : new Date(String(v))
    return isNaN(d.getTime()) ? '—' : d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const bekleyenDavetler = davetler.filter((d) => !d.kullanildi)

  return (
    <div className="p-4 pt-4">
      <div className="ads-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Başlık satırı — orijinal düzen */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebedf0] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fdecec]">
              <i className="material-icons text-[20px] text-[#c92c2c]">people_outline</i>
            </span>
            <div>
              <h2 className="text-[16px] font-semibold text-[#303030]">Kullanıcılar</h2>
              <p className="text-[12px] text-neutral-400">Kullanıcı Sayısı: {rows.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="ads-fab" onClick={() => { setDialogOpen(true); setUretilen(null) }}>
              <i className="material-icons">add</i>
              Ekle
            </button>
          </div>
        </div>

        {/* Tablo — orijinal kolon sırası */}
        <div className="scroll-style overflow-auto">
          <table className="ads-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th>Ad/Soyad</th>
                <th>Email</th>
                <th>No</th>
                <th style={{ width: '110px' }}>Görev</th>
                <th style={{ width: '150px' }}>Son Giriş</th>
                <th style={{ width: '90px' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center text-[13px] text-neutral-400">Yükleniyor...</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center gap-2 py-12 text-neutral-300">
                      <i className="material-icons" style={{ fontSize: 44 }}>people_outline</i>
                      <p className="text-[14px] font-medium text-neutral-400">Kullanıcı bulunamadı!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => {
                  const rl = ROLE_LABEL[r.role] ?? ROLE_LABEL.garson
                  return (
                    <tr key={r.id} className="hover:bg-[#fafafa]">
                      <td className="text-[13px] text-neutral-400">{i + 1}</td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fdecec] text-[12px] font-bold text-[#c92c2c]">
                            {(r.name ?? '?').slice(0, 2).toLocaleUpperCase('tr-TR')}
                          </span>
                          <span className="text-[13.5px] font-medium text-[#303030]">{r.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="text-[13.5px] text-[#303030]">{r.email ?? '—'}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13.5px] text-[#303030]">{r.phone ?? '—'}</span>
                          {r.phone && (
                            <button type="button" onClick={() => kopyala(r.phone ?? '')} className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-[#303030]" aria-label="Kopyala">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="rounded-md px-2 py-1 text-[12px] font-semibold" style={{ background: rl.bg, color: rl.fg }}>
                          {rl.label}
                        </span>
                      </td>
                      <td className="text-[13px] text-[#303030]">{r.sonGiris ? tarih(r.sonGiris) : '—'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`"${r.name}" kullanıcısının panel kaydı silinsin mi? (Giriş izni kaldırılır)`)) return
                            await kullaniciProfilleriServis.sil(r.id)
                            await load()
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#c92c2c] hover:bg-[#fdecec]"
                          aria-label="Sil"
                        >
                          <i className="material-icons" style={{ fontSize: 18 }}>delete</i>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bekleyen davet kodları */}
      {bekleyenDavetler.length > 0 && (
        <div className="ads-card mt-5">
          <div className="header flex items-center justify-between">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.6px] text-[#8a8f98]">Bekleyen Davet Kodları</h3>
            <RefreshCw className="h-4 w-4 cursor-pointer text-neutral-300 hover:text-neutral-500" onClick={load} />
          </div>
          <p className="content-desc text-[12.5px] text-neutral-400">
            Kodu personelinizle paylaşın; giriş sayfasındaki &quot;Davet koduyla personel kaydı&quot; bölümünü kullanarak hesap açabilir.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {bekleyenDavetler.map((d) => {
              const rl = ROLE_LABEL[d.role] ?? ROLE_LABEL.garson
              return (
                <span key={d.id} className="flex items-center gap-2 rounded-lg border border-[#ebedf0] bg-[#fafafa] py-2 pl-3 pr-2">
                  <span className="font-mono text-[15px] font-bold tracking-[0.15em] text-[#303030]">{d.code}</span>
                  <span className="rounded px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: rl.bg, color: rl.fg }}>{rl.label}</span>
                  <button type="button" onClick={() => kopyala(d.code)} className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-white hover:text-[#303030]" aria-label="Kopyala">
                    {kopyalandi ? <Check className="h-3.5 w-3.5 text-[#59af19]" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button type="button" onClick={() => davetSil(d)} className="flex h-7 w-7 items-center justify-center rounded text-neutral-300 hover:bg-[#fdecec] hover:text-[#c92c2c]" aria-label="Sil">
                    <i className="material-icons" style={{ fontSize: 16 }}>close</i>
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Davet kodu penceresi */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Kapat" onClick={() => setDialogOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ebedf0] px-5 py-4">
              <h3 className="text-[15px] font-semibold text-[#303030]">Yeni Kullanıcı Daveti</h3>
              <button type="button" onClick={() => setDialogOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100" aria-label="Kapat">
                <i className="material-icons" style={{ fontSize: 18 }}>close</i>
              </button>
            </div>
            <div className="flex flex-col gap-3 px-5 py-4">
              <p className="text-[13px] leading-relaxed text-neutral-500">
                Personelinizin görev tipini seçin ve davet kodunu üretin. Kodu paylaşın; personeliniz giriş sayfasından
                bu kodla hesabını oluşturur.
              </p>
              <div>
                <label className="mb-1 block text-[12.5px] font-medium text-[#5f6368]">Görev</label>
                <select className="ads-input" value={rol} onChange={(e) => setRol(e.target.value as KullaniciProfili['role'])}>
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {uretilen && (
                <div className="flex items-center justify-between rounded-lg border border-[#59af19]/30 bg-[#e8f5e9] px-4 py-3">
                  <span className="font-mono text-[20px] font-bold tracking-[0.25em] text-[#2e7d32]">{uretilen}</span>
                  <button type="button" onClick={() => kopyala(uretilen)} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#2e7d32] shadow-sm hover:bg-green-50">
                    {kopyalandi ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    Kopyala
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#ebedf0] bg-[#fafafa] px-5 py-3">
              <button type="button" onClick={() => setDialogOpen(false)} className="h-10 rounded-lg border border-[#d9d9d9] bg-white px-4 text-[13.5px] font-medium text-[#454545] hover:bg-neutral-50">
                Kapat
              </button>
              <button type="button" disabled={saving} onClick={davetOlustur} className="btn-theme flex h-10 items-center gap-2 px-5 text-[13.5px] disabled:opacity-60">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Davet Kodu Üret
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
