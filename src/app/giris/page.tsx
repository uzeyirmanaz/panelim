'use client'

// Giriş sayfası — solda marka paneli, sağda giriş formu.
// Firebase Auth ile çalışır:
//  • İlk kurulum: hiç kullanıcı yokken "İlk yöneticiyi oluştur" görünür
//  • Giriş: e-posta + şifre
//  • Personel: panelden üretilen davet kodu ile kaydolabilir
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Headset, Loader2, X, UserPlus, Rocket } from 'lucide-react'

import { useAuth } from '@/lib/firebase/auth-context'
import { BRAND } from '@/config/brand'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Mod = 'giris' | 'ilk-kurulum' | 'davet'

function GirisForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTarget = params.get('yonlendirme') || '/panel'

  const { girisYap, ilkYoneticiOlustur, davetleKaydol, hataCevir, yukleniyor, yapilandirildi, ilkKurulumGerekli, user } =
    useAuth()

  const [mod, setMod] = useState<Mod>('giris')
  const [ad, setAd] = useState('')
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [sifre2, setSifre2] = useState('')
  const [davetKodu, setDavetKodu] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  // İlk kurulum bilgisi gelince modu ayarla (bir kez)
  useEffect(() => {
    if (ilkKurulumGerekli === true) setMod('ilk-kurulum')
  }, [ilkKurulumGerekli])

  // Oturum açıksa panele yönlendir
  useEffect(() => {
    if (!yukleniyor && user) {
      router.replace(redirectTarget)
      router.refresh()
    }
  }, [user, yukleniyor, router, redirectTarget])

  // Panele gidişi hızlandır: giriş ekranı açıkken panel dosyalarını önden indir
  useEffect(() => {
    router.prefetch(redirectTarget)
  }, [router, redirectTarget])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)

    if (mod === 'ilk-kurulum' || mod === 'davet') {
      if (!email.trim() || !sifre) {
        setError('E-posta ve şifre zorunludur.')
        return
      }
      if (sifre.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır.')
        return
      }
      if (sifre !== sifre2) {
        setError('Şifreler eşleşmiyor.')
        return
      }
    }

    setSubmitting(true)
    try {
      if (mod === 'giris') {
        await girisYap(email, sifre)
      } else if (mod === 'ilk-kurulum') {
        await ilkYoneticiOlustur(ad, email, sifre)
      } else {
        await davetleKaydol(davetKodu, ad, email, sifre)
      }
      router.replace(redirectTarget)
      router.refresh()
    } catch (err) {
      setError(hataCevir(err))
      setSubmitting(false)
    }
  }

  // Firebase değerleri girilmemişse kurulum uyarısı göster
  if (!yapilandirildi) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-[460px] rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <Rocket className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="text-[19px] font-bold text-[#263238]">Kurulum gerekli</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
            Firebase bağlantı bilgileri henüz girilmedi.
            <br />
            <b>src/config/firebase-config.ts</b> dosyasını açın ve Firebase projenizin değerlerini yapıştırın.
          </p>
          <p className="mt-4 rounded-lg bg-white px-4 py-3 text-left font-mono text-[12.5px] text-neutral-500">
            apiKey: &quot;AIza...&quot;
            <br />
            projectId: &quot;proje-id&quot;
          </p>
          <p className="mt-4 text-[12.5px] text-neutral-400">Adım adım rehber: FIREBASE-KURULUM.md</p>
        </div>
      </div>
    )
  }

  const modBaslik: Record<Mod, string> = {
    giris: BRAND.welcomeTitle,
    'ilk-kurulum': 'İlk yöneticiyi oluştur',
    davet: 'Personel kaydı',
  }
  const modAlt: Record<Mod, string> = {
    giris: BRAND.welcomeSubtitle,
    'ilk-kurulum':
      'Panele ilk kez giriş yapıyorsunuz. Bu hesap tüm yetkilere sahip yönetici hesabınız olacak. Sadece bir kez yapılır.',
    davet: 'Yöneticiniz size bir davet kodu verdiyse bu bölümden hesabınızı oluşturabilirsiniz.',
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sol marka paneli */}
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-brand-700 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-black/15 blur-3xl" />

        <div className="relative">
          <Link href="/giris" aria-label="Giriş sayfası">
            <span className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[18px] font-black text-brand-700">
                {BRAND.name.slice(0, 1).toLocaleUpperCase('tr-TR')}
              </span>
              <span className="text-[22px] font-bold tracking-tight">{BRAND.name}</span>
            </span>
          </Link>
        </div>

        <figure className="relative">
          <blockquote className="text-[15.5px] leading-relaxed text-white/95">{BRAND.pitch}</blockquote>
          {BRAND.referenceAuthor && (
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[14px] font-extrabold text-brand-700">
                {BRAND.referenceAuthor.slice(0, 2).toLocaleUpperCase('tr-TR')}
              </span>
              <span className="text-[14px] font-semibold tracking-wide">{BRAND.referenceAuthor}</span>
            </figcaption>
          )}
        </figure>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} {BRAND.name} — {BRAND.tagline}
        </p>
      </aside>

      {/* Sağ form */}
      <main className="relative flex flex-1 flex-col px-4 py-6 sm:px-8">
        {/* Destek İste — sağ üst */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 text-[13px] font-medium text-neutral-600 shadow-sm transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            <Headset className="h-4 w-4" />
            Destek İste
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[400px] py-8">
            <div className="mb-8 lg:hidden">
              <Link href="/giris">
                <span className="inline-flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-[16px] font-black text-white">
                    {BRAND.name.slice(0, 1).toLocaleUpperCase('tr-TR')}
                  </span>
                  <span className="text-[20px] font-bold tracking-tight text-[#263238]">{BRAND.name}</span>
                </span>
              </Link>
            </div>

            <h1 className="text-[22px] font-bold tracking-tight text-[#263238]">{modBaslik[mod]}</h1>
            <p className="mt-1.5 text-[14px] text-neutral-500">{modAlt[mod]}</p>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="Hata mesajını kapat"
                  className="mt-0.5 text-red-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              {mod === 'davet' && (
                <div className="space-y-1.5">
                  <label htmlFor="davet" className="block text-[13px] font-medium text-neutral-700">
                    Davet Kodu <span className="text-brand-600">*</span>
                  </label>
                  <input
                    id="davet"
                    type="text"
                    required
                    placeholder="6 haneli davet kodu"
                    value={davetKodu}
                    onChange={(e) => setDavetKodu(e.target.value.toUpperCase())}
                    className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3.5 font-mono text-[15px] uppercase tracking-[0.2em] text-[#263238] outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-neutral-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                  />
                </div>
              )}

              {(mod === 'ilk-kurulum' || mod === 'davet') && (
                <div className="space-y-1.5">
                  <label htmlFor="ad" className="block text-[13px] font-medium text-neutral-700">
                    Ad Soyad <span className="text-brand-600">*</span>
                  </label>
                  <input
                    id="ad"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Adınız soyadınız"
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3.5 text-[14px] text-[#263238] outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[13px] font-medium text-neutral-700">
                  E-posta <span className="text-brand-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="ornek@isletme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3.5 text-[14px] text-[#263238] outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sifre" className="block text-[13px] font-medium text-neutral-700">
                  Şifre <span className="text-brand-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="sifre"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={mod === 'giris' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={sifre}
                    onChange={(e) => setSifre(e.target.value)}
                    className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3.5 pr-11 text-[14px] text-[#263238] outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {mod === 'ilk-kurulum' && (
                <div className="space-y-1.5">
                  <label htmlFor="sifre2" className="block text-[13px] font-medium text-neutral-700">
                    Şifre (tekrar) <span className="text-brand-600">*</span>
                  </label>
                  <input
                    id="sifre2"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={sifre2}
                    onChange={(e) => setSifre2(e.target.value)}
                    className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3.5 text-[14px] text-[#263238] outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                  />
                </div>
              )}

              {mod === 'giris' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-[13px] font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline"
                  >
                    Şifremi unuttum
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || yukleniyor}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-[14.5px] font-semibold text-white shadow-[0_10px_22px_-10px_rgba(184,59,54,0.75)] transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mod === 'giris' ? 'Giriş Yap' : mod === 'ilk-kurulum' ? 'Yöneticiyi Oluştur' : 'Hesabımı Oluştur'}
              </button>
            </form>

            {/* Mod geçişleri */}
            <div className="mt-6 space-y-2 text-center text-[13.5px] text-neutral-500">
              {mod === 'giris' && ilkKurulumGerekli === false && (
                <p>
                  <button
                    type="button"
                    onClick={() => setMod('davet')}
                    className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    <span className="inline-flex items-center gap-1">
                      <UserPlus className="h-3.5 w-3.5" /> Davet koduyla personel kaydı
                    </span>
                  </button>
                </p>
              )}
              {mod !== 'giris' && (
                <p>
                  <button
                    type="button"
                    onClick={() => setMod('giris')}
                    className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    ← Giriş ekranına dön
                  </button>
                </p>
              )}
            </div>

            <p className="mt-10 text-center text-[11.5px] text-neutral-300">
              © {new Date().getFullYear()} {BRAND.name}
            </p>
          </div>
        </div>
      </main>

      {/* Şifremi unuttum penceresi */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Şifremi unuttum</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-1 text-left leading-relaxed">
                <p>
                  Şifre sıfırlama bağlantısı e-postanıza gönderilebilir. Bunun için Firebase konsolunda
                  <b> Authentication → Templates</b> bölümünden şifre sıfırlama e-postasını etkinleştirin.
                </p>
                <p>
                  Alternatif olarak yöneticiniz Firebase konsolunda <b>Authentication → Users</b> bölümünden hesabınızı
                  sıfırlayabilir.
                </p>
                <p>
                  Destek için: <b>{BRAND.supportEmail}</b>
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Destek İste penceresi */}
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Destek İste</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-1 text-left leading-relaxed">
                <p>
                  Destek ekibimize ulaşmak için <b>{BRAND.supportEmail}</b> adresine yazabilir veya{' '}
                  <b>{BRAND.supportPhone}</b> numarasını arayabilirsiniz.
                </p>
                <p>{BRAND.supportHours}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// useSearchParams Suspense sınırı gerektirir (statik derleme için)
export default function GirisPage() {
  return (
    <Suspense>
      <GirisForm />
    </Suspense>
  )
}
