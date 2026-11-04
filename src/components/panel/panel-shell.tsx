'use client'

// Panel kabuğu — orijinal panelden bire bir:
// • Solda beyaz sidenav (#sidenav): logo + marka adı + restoran adı,
//   tam menü ağacı (Ana Sayfa, Entegrasyon İşlemleri, Dijital Menü,
//   Tanımlamalar, Raporlar, Uygulama Mağazası, Tavsiye Et ve Kazan)
// • Üstte generalToolbar: hamburger + sayfa başlığı solda;
//   ödeme/hediye/Katıl/yenile/daha fazla/duyuru | Destek İste + profil sağda
// • Sağda bildirim çekmecesi (notificationSidenav)
// • Soket bağlantı durumu bildirimi (app-ads-socket-reconnecting-loader)
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/auth-context'
import { BRAND } from '@/config/brand'
import { usePosEvents } from '@/hooks/use-pos-events'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export type PanelUser = {
  id: string
  username: string
  email: string | null
  name: string
  role: string
}

type MenuLeaf = { label: string; icon?: string; img?: string; href: string; badge?: string }
type MenuNode =
  | { kind: 'leaf'; label: string; icon: string; href: string; img?: string }
  | { kind: 'group'; label: string; icon: string; defaultOpen?: boolean; children: MenuLeaf[] }

// Orijinal sidenav menüsü (sıra ve ikonlar aynen korunmuştur)
const MENU: MenuNode[] = [
  { kind: 'leaf', label: 'Ana Sayfa', icon: 'home', href: '/panel' },
  {
    kind: 'group',
    label: 'Entegrasyon İşlemleri',
    icon: 'widgets',
    children: [
      { label: 'Ürün Eşleştirme Ekranı', icon: 'room_service', href: '/panel/urun-eslestirme' },
      { label: 'Entegrasyon İşlemleri', icon: 'checklist', href: '/panel/entegrasyon', badge: 'Yeni' },
    ],
  },
  { kind: 'leaf', label: 'Dijital Menü', icon: 'vibration', href: '/panel/dijital-menu' },
  {
    kind: 'group',
    label: 'Tanımlamalar',
    icon: 'assignment_turned_in',
    defaultOpen: true,
    children: [
      { label: 'Masa / Bölgeler', icon: 'view_quilt', href: '/panel/masalar' },
      { label: 'Menü / Ürünler', icon: 'restaurant_menu', href: '/panel/menu' },
      { label: 'Birimler', icon: 'library_books', href: '/panel/birimler' },
      { label: 'Özellikler', icon: 'view_list', href: '/panel/ozellikler' },
      { label: 'Kdv Oranları', icon: 'percent', href: '/panel/kdv-oranlari' },
      { label: 'İndirimler', icon: 'label', href: '/panel/indirimler' },
      { label: 'Mutfak Grupları', icon: 'dvr', href: '/panel/mutfak-gruplari' },
      { label: 'Müşteriler', icon: 'assignment_ind', href: '/panel/musteriler' },
      { label: 'Ödenmezler', icon: 'badge', href: '/panel/odenmezler' },
      { label: 'Sipariş', icon: 'shopping_basket', href: '/panel/siparis-tanimlari' },
      {
        label: 'İşlemler',
        icon: 'layers',
        href: '#islem',
      },
      { label: 'Kullanıcılar', icon: 'people', href: '/panel/kullanicilar' },
      { label: 'Yetkiler', icon: 'verified_user', href: '/panel/yetkiler' },
    ],
  },
  {
    kind: 'group',
    label: 'Raporlar',
    icon: 'pie_chart',
    children: [
      { label: 'Ürün Satış Raporu', icon: 'show_chart', href: '/panel/raporlar/urun-satis' },
      { label: 'Gün Sonu Raporu', icon: 'monetization_on', href: '/panel/raporlar/gun-sonu' },
      { label: 'Vardiya Satış Raporu', icon: 'request_quote', href: '/panel/raporlar/vardiya' },
      { label: 'Restaurant İstatistikleri', icon: 'query_stats', href: '/panel/raporlar/istatistik' },
      { label: 'Fire Raporu', icon: 'inventory_2', href: '/panel/raporlar/fire' },
      { label: 'Rapor Sihirbazı', icon: 'pivot_table_chart', href: '/panel/raporlar/sihirbaz' },
      { label: 'Maliyet-Karlılık Raporu', icon: 'trending_up', href: '/panel/raporlar/maliyet' },
    ],
  },
  { kind: 'leaf', label: 'Uygulama Mağazası', icon: 'apps', href: '/panel/uygulama-magazasi' },
  { kind: 'leaf', label: 'Tavsiye Et ve Kazan', icon: 'card_giftcard', href: '/panel/tavsiye-et' },
]

// "İşlemler" alt grubu (Tanımlamalar içinde ikinci seviye)
const ISLEMLER_CHILDREN: MenuLeaf[] = [
  { label: 'Gider / Masraf İşlemleri', icon: 'trending_down', href: '/panel/gider-masraf' },
  { label: 'Zayi İşlemleri', icon: 'broken_image', href: '/panel/zayi' },
]

const PAGE_TITLES: Array<[string, string]> = [
  ['/panel', 'Ana Sayfa'],
  ['/panel/urun-eslestirme', 'Ürün Eşleştirme Ekranı'],
  ['/panel/entegrasyon', 'Entegrasyon İşlemleri'],
  ['/panel/dijital-menu', 'Dijital Menü'],
  ['/panel/masalar', 'Masa / Bölgeler'],
  ['/panel/menu', 'Menü / Ürünler'],
  ['/panel/birimler', 'Birimler'],
  ['/panel/ozellikler', 'Özellikler'],
  ['/panel/kdv-oranlari', 'Kdv Oranları'],
  ['/panel/indirimler', 'İndirimler'],
  ['/panel/mutfak-gruplari', 'Mutfak Grupları'],
  ['/panel/musteriler', 'Müşteriler'],
  ['/panel/odenmezler', 'Ödenmezler'],
  ['/panel/siparis-tanimlari', 'Sipariş'],
  ['/panel/gider-masraf', 'Gider / Masraf İşlemleri'],
  ['/panel/zayi', 'Zayi İşlemleri'],
  ['/panel/kullanicilar', 'Kullanıcılar'],
  ['/panel/yetkiler', 'Yetkiler'],
  ['/panel/raporlar/urun-satis', 'Ürün Satış Raporu'],
  ['/panel/raporlar/gun-sonu', 'Gün Sonu Raporu'],
  ['/panel/raporlar/vardiya', 'Vardiya Satış Raporu'],
  ['/panel/raporlar/istatistik', 'Restaurant İstatistikleri'],
  ['/panel/raporlar/fire', 'Fire Raporu'],
  ['/panel/raporlar/sihirbaz', 'Rapor Sihirbazı'],
  ['/panel/raporlar/maliyet', 'Maliyet-Karlılık Raporu'],
  ['/panel/uygulama-magazasi', 'Uygulama Mağazası'],
  ['/panel/tavsiye-et', 'Tavsiye Et ve Kazan'],
  ['/panel/hesabim', 'Hesabım'],
  ['/panel/siparisler', 'Siparişler'],
  ['/panel/mutfak', 'Mutfak Ekranı'],
]

function pageIcon(href: string): string {
  if (href === '/panel') return 'home'
  if (href.startsWith('/panel/masalar')) return 'view_quilt'
  if (href.startsWith('/panel/menu')) return 'restaurant_menu'
  if (href.startsWith('/panel/raporlar')) return 'pie_chart'
  if (href.startsWith('/panel/mutfak')) return 'soup_kitchen'
  if (href.startsWith('/panel/siparisler')) return 'shopping_basket'
  return 'assignment_turned_in'
}

export function PanelShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  // Kimlik doğrulama — Firebase Auth bağlamından gelir
  const { user: authUser, profil, yukleniyor: authYukleniyor, cikisYap } = useAuth()
  const user: PanelUser | null = authUser
    ? {
        id: authUser.uid,
        username: profil?.email ?? (authUser.email ?? ''),
        email: authUser.email ?? null,
        name: profil?.name ?? authUser.displayName ?? (authUser.email ?? 'Kullanıcı'),
        role: profil?.role ?? 'admin',
      }
    : null
  const userLoaded = !authYukleniyor && Boolean(authUser)
  const [sidenavOpen, setSidenavOpen] = useState(true) // masaüstü kenar çubuğu
  const [mobileOpen, setMobileOpen] = useState(false) // mobil çekmece
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [connected, setConnected] = useState(false)
  const [showConnected, setShowConnected] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  // Açılır menü grupları: yol içinde geçen gruplar açık başlar
  const activeGroupLabels = (() => {
    const labels = new Set<string>()
    for (const node of MENU) {
      if (node.kind !== 'group') continue
      if (node.children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'))) labels.add(node.label)
    }
    if (pathname.startsWith('/panel/gider-masraf') || pathname.startsWith('/panel/zayi')) labels.add('Tanımlamalar')
    return labels
  })()
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const node of MENU) if (node.kind === 'group' && node.defaultOpen) s.add(node.label)
    return s
  })
  const [openIslemler, setOpenIslemler] = useState(false)

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      for (const label of activeGroupLabels) next.add(label)
      return next
    })
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUser = useCallback(async () => {
    // authYukleniyor false olduktan sonra kullanıcı yoksa giriş sayfasına dön
    if (!authYukleniyor && !authUser) {
      router.replace('/giris')
    }
  }, [authYukleniyor, authUser, router])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Soket durumu — orijinaldeki "Bağlantı başarılı..." bildirimi
  const { connected: socketConnected } = usePosEvents(() => {})
  useEffect(() => setConnected(socketConnected), [socketConnected])
  const [everConnected, setEverConnected] = useState(false)
  useEffect(() => {
    if (!connected) return
    setEverConnected(true)
    setShowConnected(true)
    const t = setTimeout(() => setShowConnected(false), 2500)
    return () => clearTimeout(t)
  }, [connected])
  // Bağlantı hiç kurulmadıysa uyarıyı kalıcı gösterme (6 sn sonra gizle)
  const [showReconnecting, setShowReconnecting] = useState(false)
  useEffect(() => {
    if (connected || everConnected) return
    setShowReconnecting(true)
    const t = setTimeout(() => setShowReconnecting(false), 6000)
    return () => clearTimeout(t)
  }, [connected, everConnected])

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
    setMoreOpen(false)
    setNotifOpen(false)
  }, [pathname])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  async function logout() {
    try {
      await cikisYap()
    } finally {
      router.replace('/giris')
      router.refresh()
    }
  }

  // Tam ekran sipariş/masa ekranı kendi kabuğuna sahip
  if (pathname === '/panel/siparis' || pathname === '/panel/harita') {
    return <>{children}</>
  }

  // Önce tam eşleşme, sonra en uzun yol eşleşmesi (/panel /panel/hesabim karışmasın)
  const pageTitle = (() => {
    const exact = PAGE_TITLES.find(([p]) => p === pathname)
    if (exact) return exact[1]
    const partial = PAGE_TITLES.filter(([p]) => pathname.startsWith(p + '/')).sort((a, b) => b[0].length - a[0].length)[0]
    return partial?.[1] ?? BRAND.name
  })()

  const restaurantName = BRAND.restaurantName
  const accountCode = BRAND.accountCode
  const profileLabel = `${accountCode} - ${user?.name ?? ''}`

  const renderLeaf = (leaf: MenuLeaf, key: string, nested = false) => {
    const active = pathname === leaf.href
    return (
      <Link
        key={key}
        href={leaf.href}
        className={cn('ads-menu-item', nested && 'pl-[68px]', active && 'active')}
        onClick={() => setMobileOpen(false)}
      >
        {leaf.img ? (
          <img src={leaf.img} width={21} className="mr-2.5 shrink-0" alt="" />
        ) : (
          <i className="material-icons menu-item-icon">{leaf.icon}</i>
        )}
        <span className="truncate">{leaf.label}</span>
        {leaf.badge && <span className="new-menu shadowPulse">{leaf.badge}</span>}
      </Link>
    )
  }

  const sidenavInner = (
    <>
      {/* Logo + restoran adı — orijinal menu-mini-logo */}
      <div className="padding-top-5 shrink-0 border-b border-[#ebedf0] pb-3 pt-4">
        <div className="flex items-center justify-center gap-1.5 px-4">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-brand-600 text-[15px] font-black text-white">
            {BRAND.name.slice(0, 1).toLocaleUpperCase('tr-TR')}
          </span>
          <span className="text-[18px] font-bold leading-none text-[#303030]">{BRAND.name}</span>
          <span className="version-number self-start text-[11px] font-semibold leading-none text-[#a0a0a0]">{BRAND.version}</span>
        </div>
        <p className="restaurant-name mt-2 truncate px-4 text-center text-[15px] font-bold text-[#303030]">
          {restaurantName} - {accountCode}
        </p>
      </div>

      {/* Menü ağacı */}
      <nav
        aria-label="Ana menü"
        className="scroll-style-light overflow-auto flex-1 py-1.5 full-height"
      >
        {MENU.map((node) => {
          if (node.kind === 'leaf') {
            const active = node.href === '/panel' ? pathname === '/panel' : pathname === node.href || pathname.startsWith(node.href + '/')
            return (
              <Link
                key={node.label}
                href={node.href}
                className={cn('ads-menu-item', active && 'active')}
                onClick={() => setMobileOpen(false)}
              >
                <i className="material-icons menu-item-icon">{node.icon}</i>
                <span className="truncate">{node.label}</span>
              </Link>
            )
          }
          const isOpen = openGroups.has(node.label)
          const containsActive = activeGroupLabels.has(node.label)
          return (
            <div key={node.label}>
              <button
                type="button"
                className={cn('ads-menu-item', containsActive && isOpen && 'text-[#303030]')}
                onClick={() =>
                  setOpenGroups((prev) => {
                    const next = new Set(prev)
                    if (next.has(node.label)) next.delete(node.label)
                    else next.add(node.label)
                    return next
                  })
                }
              >
                <i className="material-icons menu-item-icon">{node.icon}</i>
                <span className="truncate">{node.label}</span>
                <i className={cn('material-icons drop-down-icon', isOpen && 'open')}>expand_more</i>
              </button>
              {isOpen && (
                <div className="ads-sub-menu">
                  {node.children.map((leaf) =>
                    leaf.label === 'İşlemler' ? (
                      <div key={leaf.label}>
                        <button
                          type="button"
                          className={cn(
                            'ads-menu-item',
                            (pathname.startsWith('/panel/gider-masraf') || pathname.startsWith('/panel/zayi')) && 'text-[#303030]'
                          )}
                          onClick={() => setOpenIslemler((v) => !v)}
                        >
                          <i className="material-icons menu-item-icon">layers</i>
                          <span className="truncate">İşlemler</span>
                          <i className={cn('material-icons drop-down-icon', openIslemler && 'open')}>expand_more</i>
                        </button>
                        {openIslemler &&
                          ISLEMLER_CHILDREN.map((c) => renderLeaf(c, c.href, true))}
                      </div>
                    ) : (
                      renderLeaf(leaf, leaf.href)
                    )
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </>
  )

  return (
    <div className="ads-root ads-panel-font min-h-screen bg-[#fafafa]">
      {/* Masaüstü sidenav */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col bg-white transition-[width,transform] duration-200 lg:flex',
          'shadow-[1px_0_0_0_#ebedf0]',
          sidenavOpen ? 'w-[270px] translate-x-0' : 'w-0 -translate-x-full overflow-hidden'
        )}
      >
        {sidenavInner}
      </aside>

      {/* Mobil çekmece */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[270px] flex-col bg-white shadow-2xl">{sidenavInner}</aside>
        </div>
      )}

      {/* İçerik */}
      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', sidenavOpen ? 'lg:pl-[270px]' : 'lg:pl-0')}>
        {/* generalToolbar */}
        <header className="ads-toolbar sticky top-0 z-30">
          <div className="menu-items-left flex items-center">
            <button
              type="button"
              id="navMenuBtn"
              aria-label="Menü"
              onClick={() => {
                if (window.matchMedia('(min-width: 1024px)').matches) setSidenavOpen((v) => !v)
                else setMobileOpen(true)
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#454545] hover:bg-neutral-100"
            >
              <i className="material-icons" style={{ fontSize: 24 }}>menu</i>
            </button>
            <h6 className="title truncate pl-1 text-[17px] font-semibold text-[#303030]">{pageTitle}</h6>
          </div>

          <div className="menu-items-right flex items-center">
            {/* refresh */}
            <button type="button" className="ads-toolbar-btn" style={{ color: '#2d2d2d', backgroundColor: '#f5f5f5' }} onClick={() => window.location.reload()} aria-label="Yenile">
              <i className="material-icons" style={{ fontSize: 20, marginRight: 0 }}>refresh</i>
            </button>

            {/* more-button */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                className="ads-toolbar-btn"
                style={{ color: '#2d2d2d', backgroundColor: '#f5f5f5' }}
                onClick={() => setMoreOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                aria-label="Daha fazla"
              >
                <i className="material-icons" style={{ fontSize: 20, marginRight: 0 }}>more_vert</i>
              </button>
              {moreOpen && (
                <div role="menu" className="absolute right-0 top-[50px] w-56 overflow-hidden rounded-lg border border-neutral-100 bg-white py-1 shadow-xl">
                  <Link href="/panel/dijital-menu" role="menuitem" className="flex h-10 items-center gap-3 px-4 text-[13px] text-[#454545] hover:bg-neutral-50">
                    <i className="material-icons" style={{ fontSize: 18 }}>vibration</i> Dijital Menü
                  </Link>
                  <Link href="/panel/siparisler" role="menuitem" className="flex h-10 items-center gap-3 px-4 text-[13px] text-[#454545] hover:bg-neutral-50">
                    <i className="material-icons" style={{ fontSize: 18 }}>shopping_basket</i> Siparişler
                  </Link>
                  <Link href="/panel/mutfak" role="menuitem" className="flex h-10 items-center gap-3 px-4 text-[13px] text-[#454545] hover:bg-neutral-50">
                    <i className="material-icons" style={{ fontSize: 18 }}>soup_kitchen</i> Mutfak Ekranı
                  </Link>
                </div>
              )}
            </div>

            {/* announcekit */}
            <button type="button" className="ads-toolbar-btn hidden md:inline-flex" style={{ color: '#2d2d2d', backgroundColor: '#f5f5f5' }} aria-label="Duyurular">
              <i className="material-icons" style={{ fontSize: 20, marginRight: 0 }}>campaign</i>
            </button>

            <span className="margin-10 mx-1 hidden text-[20px] text-[#303030] opacity-[0.02] sm:inline">|</span>

            {/* support-button */}
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="ads-toolbar-btn hidden px-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] md:inline-flex"
              style={{ color: '#D90101', backgroundColor: '#feefef' }}
            >
              <i className="material-icons" style={{ fontSize: 20, marginRight: 10 }}>support_agent</i>
              <span className="btn-text">Destek İste</span>
            </button>

            {/* profile-button */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="ads-toolbar-btn px-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                style={{ color: '#0056A8', backgroundColor: '#ebf6ff' }}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <i className="material-icons" style={{ fontSize: 20, marginRight: 10 }}>manage_accounts</i>
                <span className="btn-text hidden max-w-[180px] truncate md:inline">{profileLabel}</span>
              </button>
              {profileOpen && (
                <div role="menu" className="absolute right-0 top-[50px] w-56 overflow-hidden rounded-lg border border-neutral-100 bg-white py-1 shadow-xl">
                  <div className="border-b border-neutral-100 px-4 py-3">
                    <p className="text-[13px] font-semibold text-[#303030]">{user?.name ?? '…'}</p>
                    <p className="text-[12px] text-neutral-400">{user?.email ?? ''}</p>
                  </div>
                  <Link href="/panel/hesabim" role="menuitem" className="flex h-10 items-center gap-3 px-4 text-[13px] text-[#454545] hover:bg-neutral-50">
                    <i className="material-icons" style={{ fontSize: 18 }}>account_circle</i> Hesabım
                  </Link>
                  <Link href="/panel/kullanicilar" role="menuitem" className="flex h-10 items-center gap-3 px-4 text-[13px] text-[#454545] hover:bg-neutral-50">
                    <i className="material-icons" style={{ fontSize: 18 }}>people</i> Kullanıcılar
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={logout}
                    className="flex h-10 w-full items-center gap-3 px-4 text-left text-[13px] text-[#c92c2c] hover:bg-red-50"
                  >
                    <i className="material-icons" style={{ fontSize: 18 }}>logout</i> Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Soket bağlantı bildirimi — orijinal socket-reconnecting-loader */}
        <div className="pointer-events-none fixed left-1/2 top-[76px] z-50 -translate-x-1/2">
          {connected && showConnected ? (
            <div className="socket-reconnecting-loader flex items-center rounded-lg bg-white px-4 py-2 shadow-lg ring-1 ring-black/5">
              <i className="material-icons text-[#59af19]" style={{ fontSize: 20 }}>check</i>
              <span className="margin-left-10 text-[13px] text-[#454545]">Bağlantı başarılı...</span>
            </div>
          ) : !connected && showReconnecting && userLoaded ? (
            <div className="socket-reconnecting-loader flex items-center rounded-lg bg-white px-4 py-2 shadow-lg ring-1 ring-black/5">
              <i className="material-icons animate-spin text-[#f69322]" style={{ fontSize: 20 }}>sync</i>
              <span className="margin-left-10 text-[13px] text-[#454545]">Bağlantı yeniden kuruluyor...</span>
            </div>
          ) : null}
        </div>

        <main className="min-h-0 flex-1">{userLoaded && user ? children : <PanelSkeleton />}</main>
      </div>

      {/* Bildirim çekmecesi — orijinal notificationSidenav */}
      <div className={cn('fixed inset-0 z-50', !notifOpen && 'pointer-events-none')}>
        <button
          type="button"
          aria-label="Bildirimleri kapat"
          onClick={() => setNotifOpen(false)}
          className={cn('absolute inset-0 bg-black/40 transition-opacity', notifOpen ? 'opacity-100' : 'opacity-0')}
          tabIndex={notifOpen ? 0 : -1}
        />
        <aside
          className={cn(
            'notification-menu absolute inset-y-0 right-0 flex w-[340px] max-w-[90vw] flex-col bg-white shadow-2xl transition-transform duration-200',
            notifOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="notification-content flex h-full flex-col">
            <h4 className="content-title flex items-center justify-between border-b border-[#ebedf0] px-4 py-4">
              <div className="title flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-[12px] font-black text-white">
                  {BRAND.name.slice(0, 1).toLocaleUpperCase('tr-TR')}
                </span>
                <span className="margin-left-10 pl-2.5 text-[16px] font-semibold text-[#303030]">Bildirimler</span>
              </div>
              <div className="title-buttons flex items-center">
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-[#454545] hover:bg-neutral-100" aria-label="Yenile">
                  <i className="material-icons" style={{ fontSize: 20 }}>settings_backup_restore</i>
                </button>
                <button type="button" onClick={() => setNotifOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-[#454545] hover:bg-neutral-100" aria-label="Kapat">
                  <i className="material-icons" style={{ fontSize: 20 }}>close</i>
                </button>
              </div>
            </h4>
            <div className="content-items flex flex-1 items-center justify-center">
              <p className="not-found-message text-[14px] text-neutral-400">Bildirim Yok</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Bildirim çanı — toolbar sağ üstte küçük rozet ile */}
      {!notifOpen && (
        <button
          type="button"
          onClick={() => setNotifOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full text-[#0056A8] shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: '#ebf6ff' }}
          aria-label="Bildirimler"
        >
          <i className="material-icons" style={{ fontSize: 22 }}>notifications</i>
        </button>
      )}

      {/* Destek İste — orijinal destek akışı */}
      {supportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Kapat" onClick={() => setSupportOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSupportOpen(false)}
              aria-label="Kapat"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
            >
              <i className="material-icons" style={{ fontSize: 18 }}>close</i>
            </button>
            <h2 className="text-[16px] font-semibold text-[#303030]">Destek İste</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
              Destek ekibimize ulaşmak için <span className="font-semibold text-[#c92c2c]">destek@adisyo.com</span> adresine
              yazabilir veya <span className="font-semibold text-[#c92c2c]">+90 (216) 706 06 24</span> numarasını
              arayabilirsiniz.
            </p>
            <button type="button" onClick={() => setSupportOpen(false)} className="btn-theme mt-5 h-10 w-full text-[13px]">
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[10px]" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-[10px]" />
    </div>
  )
}

// Sayfa içi ikon yardımcıları (tanımlama sayfalarında tekrar kullanılır)
export { pageIcon }
