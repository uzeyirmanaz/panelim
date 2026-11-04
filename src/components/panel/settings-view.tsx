'use client'

// Ayarlar: hesap bilgileri, işletme bilgisi, masa QR kodları ve sistem durumu
import { withBase } from '@/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { api } from '@/lib/api'
import type { TableDTO } from '@/lib/types'
import { usePosEvents } from '@/hooks/use-pos-events'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/firebase/auth-context'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Armchair, Database, Download, QrCode, Server, UserRound } from 'lucide-react'

export function SettingsView() {
  const { toast } = useToast()
  const { user: authUser, profil } = useAuth()
  const user = authUser
    ? {
        id: authUser.uid,
        username: profil?.email ?? (authUser.email ?? ''),
        email: authUser.email ?? null,
        name: profil?.name ?? authUser.displayName ?? (authUser.email ?? 'Kullanıcı'),
        role: profil?.role ?? 'admin',
      }
    : null
  const [tables, setTables] = useState<TableDTO[] | null>(null)
  const [version, setVersion] = useState(0)
  const [qr, setQr] = useState<{ table: TableDTO; url: string; image: string } | null>(null)

  const refetch = useCallback(() => setVersion((v) => v + 1), [])
  usePosEvents(
    useCallback((e) => {
      if (['table:changed', 'menu:changed'].includes(e.event)) refetch()
    }, [refetch])
  )

  useEffect(() => {
    let cancelled = false
    Promise.all([api.get<TableDTO[]>('/api/tables')])
      .then(([t]) => {
        if (!cancelled) {
          setTables(t)
        }
      })
      .catch((err) => {
        if (!cancelled)
          toast({
            title: 'Ayarlar yüklenemedi',
            description: String(err instanceof Error ? err.message : err),
            variant: 'destructive',
          })
      })
    return () => {
      cancelled = true
    }
  }, [version, toast])

  async function openQr(t: TableDTO) {
    try {
      const link = `${window.location.origin}${withBase('/menu/')}?masa=${t.id}`
      const image = await QRCode.toDataURL(link, {
        width: 512,
        margin: 2,
        color: { dark: '#3b0764', light: '#ffffff' },
      })
      setQr({ table: t, url: link, image })
    } catch {
      toast({ title: 'QR kodu üretilemedi', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Hesap */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4 text-brand-600" /> Hesap Bilgileri
            </CardTitle>
            <CardDescription>Oturumda olan kullanıcı</CardDescription>
          </CardHeader>
          <CardContent>
            {!user ? (
              <Skeleton className="h-20 rounded-xl" />
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between border-b py-2">
                  <dt className="text-muted-foreground">Ad Soyad</dt>
                  <dd className="font-semibold">{user.name}</dd>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <dt className="text-muted-foreground">Kullanıcı adı</dt>
                  <dd className="font-mono text-[13px]">{user.username}</dd>
                </div>
                <div className="flex items-center justify-between border-b py-2">
                  <dt className="text-muted-foreground">E-posta</dt>
                  <dd className="text-[13px]">{user.email ?? '—'}</dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-muted-foreground">Yetki</dt>
                  <dd>
                    <Badge className="bg-brand-600 text-white hover:bg-brand-600">
                      {user.role === 'admin' ? 'Yönetici' : user.role}
                    </Badge>
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Sistem */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-brand-600" /> Sistem Durumu
            </CardTitle>
            <CardDescription>Çalışan bileşenler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between border-b py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4" /> Veritabanı (SQLite + Prisma)
              </span>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                Çalışıyor
              </Badge>
            </div>
            <div className="flex items-center justify-between border-b py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Server className="h-4 w-4" /> Canlı olay servisi (socket.io)
              </span>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                Çalışıyor
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Armchair className="h-4 w-4" /> Tanımlı masa sayısı
              </span>
              <span className="font-semibold">{tables ? tables.length : '…'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Masa QR kodları */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-4 w-4 text-brand-600" /> Masa QR Kodları
          </CardTitle>
          <CardDescription>
            Her masa için QR kodunu açın, PNG olarak indirin ve masaya yerleştirin. Kodun içeriği{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">/menu?masa=…</code> bağlantısıdır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tables ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {tables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openQr(t)}
                  className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm font-medium transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <QrCode className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR dialog */}
      <Dialog open={!!qr} onOpenChange={(open) => !open && setQr(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{qr?.table.name} — QR Kodu</DialogTitle>
            <DialogDescription>Masaya bırakmak için PNG olarak indirin.</DialogDescription>
          </DialogHeader>
          {qr && (
            <div className="space-y-3">
              <img
                src={qr.image}
                alt={`${qr.table.name} QR kodu`}
                className="mx-auto h-52 w-52 rounded-xl border shadow-sm"
              />
              <p className="break-all rounded-lg bg-muted px-3 py-2 text-center font-mono text-[11px] text-muted-foreground">
                {qr.url}
              </p>
              <a
                href={qr.image}
                download={`qr-${qr.table.name.toLocaleLowerCase('tr-TR').replace(/\s+/g, '-')}.png`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                <Download className="h-4 w-4" /> PNG İndir
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
