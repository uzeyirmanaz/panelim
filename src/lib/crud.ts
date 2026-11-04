import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Tanımlamalar için ortak CRUD API üreteci (orijinal paneldeki gibi listele/ekle/güncelle/sil)
// model: prisma delegate adı; sanitize: gövdeden alan seçimi/tip dönüşümü
type AnyDelegate = {
  findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>
  create: (args: unknown) => Promise<unknown>
  update: (args: unknown) => Promise<unknown>
  delete: (args: unknown) => Promise<unknown>
}

type DelegateMap = {
  units: AnyDelegate
  features: AnyDelegate
  vatRates: AnyDelegate
  discounts: AnyDelegate
  kitchenGroups: AnyDelegate
  customers: AnyDelegate
  defaulters: AnyDelegate
  expenses: AnyDelegate
  wastes: AnyDelegate
}

const DELEGATES: Record<keyof DelegateMap, AnyDelegate> = {
  units: db.unit as unknown as AnyDelegate,
  features: db.feature as unknown as AnyDelegate,
  vatRates: db.vatRate as unknown as AnyDelegate,
  discounts: db.discount as unknown as AnyDelegate,
  kitchenGroups: db.kitchenGroup as unknown as AnyDelegate,
  customers: db.customer as unknown as AnyDelegate,
  defaulters: db.defaulter as unknown as AnyDelegate,
  expenses: db.expense as unknown as AnyDelegate,
  wastes: db.waste as unknown as AnyDelegate,
}

export function crudRoutes(
  model: keyof DelegateMap,
  sanitize: (body: Record<string, unknown>) => Record<string, unknown> = (b) => b
) {
  const delegate = () => DELEGATES[model]

  async function GET() {
    const items = await delegate().findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, data: items })
  }

  async function POST(req: NextRequest) {
    try {
      const body = (await req.json()) as Record<string, unknown>
      const item = await delegate().create({ data: sanitize(body) })
      return NextResponse.json({ ok: true, data: item })
    } catch (e) {
      return NextResponse.json({ ok: false, error: message(e) }, { status: 400 })
    }
  }

  async function PATCH(req: NextRequest) {
    try {
      const { id, ...rest } = (await req.json()) as Record<string, unknown> & { id: string }
      if (!id) return NextResponse.json({ ok: false, error: 'id gerekli' }, { status: 400 })
      const item = await delegate().update({ where: { id }, data: sanitize(rest) })
      return NextResponse.json({ ok: true, data: item })
    } catch (e) {
      return NextResponse.json({ ok: false, error: message(e) }, { status: 400 })
    }
  }

  async function DELETE(req: NextRequest) {
    try {
      const id = new URL(req.url).searchParams.get('id')
      if (!id) return NextResponse.json({ ok: false, error: 'id gerekli' }, { status: 400 })
      await delegate().delete({ where: { id } })
      return NextResponse.json({ ok: true })
    } catch (e) {
      return NextResponse.json({ ok: false, error: message(e) }, { status: 400 })
    }
  }

  return { GET, POST, PATCH, DELETE }
}

function message(e: unknown): string {
  const err = e as { code?: string; message?: string }
  if (err?.code === 'P2002') return 'Bu kayıt zaten mevcut!'
  if (err?.code === 'P2025') return 'Kayıt bulunamadı!'
  return 'Girilen değerleri kontrol edin!'
}
