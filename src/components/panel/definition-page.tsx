'use client'

// Tanımlamalar sayfaları ortak bileşeni — orijinal paneldeki
// liste + Ekle butonu + düzenleme penceresi düzeninin bire bir karşılığı
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'textarea'

export type Field = {
  key: string
  label: string
  type?: FieldType
  options?: Array<{ value: string; label: string }>
  required?: boolean
  placeholder?: string
  defaultValue?: string | number
}

export type Column = {
  key: string
  label: string
  width?: string
  format?: (row: Record<string, unknown>) => React.ReactNode
}

type Props = {
  endpoint: string
  singular: string
  columns: Column[]
  fields: Field[]
  emptyIcon?: string
  emptyText?: string
}

export function DefinitionPage({ endpoint, singular, columns, fields, emptyIcon = 'inbox', emptyText }: Props) {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await api.get<Array<Record<string, unknown>>>(endpoint)
      setRows(data ?? [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLocaleLowerCase('tr-TR')
    return rows.filter((r) => Object.values(r).some((v) => typeof v === 'string' && v.toLocaleLowerCase('tr-TR').includes(q)))
  }, [rows, search])

  function openCreate() {
    setEditing(null)
    const init: Record<string, string> = {}
    for (const f of fields) init[f.key] = f.defaultValue !== undefined ? String(f.defaultValue) : ''
    setForm(init)
    setError('')
    setDialogOpen(true)
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row)
    const init: Record<string, string> = {}
    for (const f of fields) {
      const v = row[f.key]
      if (f.type === 'date' && typeof v === 'string') init[f.key] = v.slice(0, 10)
      else init[f.key] = v === null || v === undefined ? '' : String(v)
    }
    setForm(init)
    setError('')
    setDialogOpen(true)
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, unknown> = { ...form }
      if (editing) payload.id = editing.id
      if (editing) await api.patch(endpoint, payload)
      else await api.post(endpoint, payload)
      setDialogOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İşlem başarısız')
    } finally {
      setSaving(false)
    }
  }

  async function remove(row: Record<string, unknown>) {
    if (!window.confirm(`"${String(row[columns[0].key])}" silinsin mi?`)) return
    try {
      await api.del(`${endpoint}?id=${row.id}`)
      await load()
    } catch {
      /* sessiz */
    }
  }

  return (
    <div className="p-4 pt-4">
      <div className="ads-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Başlık satırı */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebedf0] px-5 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-[#303030]">{singular}</h2>
            <p className="text-[12px] text-neutral-400">{filtered.length} kayıt</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-neutral-400">search</i>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                style={{ width: 180 }} className="ads-input pl-8"
              />
            </div>
            <button type="button" className="ads-fab" onClick={openCreate}>
              <i className="material-icons">add</i>
              Ekle
            </button>
          </div>
        </div>

        {/* Tablo */}
        <div className="scroll-style overflow-auto">
          <table className="ads-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} style={{ width: c.width }}>{c.label}</th>
                ))}
                <th style={{ width: '110px' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="py-10 text-center text-[13px] text-neutral-400">Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <div className="flex flex-col items-center gap-2 py-12 text-neutral-300">
                      <i className="material-icons" style={{ fontSize: 44 }}>{emptyIcon}</i>
                      <p className="text-[14px] font-medium text-neutral-400">{emptyText ?? `Kayıt bulunamadı!`}</p>
                      <button type="button" onClick={openCreate} className="btn-theme mt-1 px-4 py-2 text-[13px]">
                        + İlk {singular.toLocaleLowerCase('tr-TR')} kaydını ekleyin
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={String(row.id)} className="hover:bg-[#fafafa]">
                    {columns.map((c) => (
                      <td key={c.key} className="align-middle">
                        {c.format ? c.format(row) : <span className="text-[13.5px]">{String(row[c.key] ?? '—')}</span>}
                      </td>
                    ))}
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#4a90e2] hover:bg-[#ebf6ff]"
                          aria-label="Düzenle"
                        >
                          <i className="material-icons" style={{ fontSize: 18 }}>edit</i>
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(row)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#c92c2c] hover:bg-[#fdecec]"
                          aria-label="Sil"
                        >
                          <i className="material-icons" style={{ fontSize: 18 }}>delete</i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ekle / Düzenle penceresi */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Kapat" onClick={() => setDialogOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ebedf0] px-5 py-4">
              <h3 className="text-[15px] font-semibold text-[#303030]">
                {editing ? `${singular} Düzenle` : `Yeni ${singular} Ekle`}
              </h3>
              <button type="button" onClick={() => setDialogOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100" aria-label="Kapat">
                <i className="material-icons" style={{ fontSize: 18 }}>close</i>
              </button>
            </div>
            <div className="flex flex-col gap-3 px-5 py-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-[12.5px] font-medium text-[#5f6368]">
                    {f.label}
                    {f.required && <span className="text-[#c92c2c]"> *</span>}
                  </label>
                  {f.type === 'select' ? (
                    <select
                      className="ads-input"
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    >
                      <option value="">Seçiniz</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      className="ads-input min-h-[72px] py-2"
                      value={form[f.key] ?? ''}
                      placeholder={f.placeholder}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      className="ads-input"
                      value={form[f.key] ?? ''}
                      placeholder={f.placeholder}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
              {error && (
                <p className="rounded-lg bg-[#fdecec] px-3 py-2 text-[13px] text-[#c92c2c]">{error}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#ebedf0] bg-[#fafafa] px-5 py-3">
              <button type="button" onClick={() => setDialogOpen(false)} className="h-10 rounded-lg border border-[#d9d9d9] bg-white px-4 text-[13.5px] font-medium text-[#454545] hover:bg-neutral-50">
                Vazgeç
              </button>
              <button type="button" disabled={saving} onClick={save} className="btn-theme h-10 px-5 text-[13.5px] disabled:opacity-60">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function money(v: unknown): string {
  const n = Number(v ?? 0)
  return n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

export function dateTr(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
