'use client'

// Hesabım sayfası — orijinal account-page bire bir (summary-card, manage-payment, payments)
import { useAuth } from '@/lib/firebase/auth-context'
import { BRAND } from '@/config/brand'

function fmt(d: Date): string {
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function HesabimPage() {
  const { user, profil } = useAuth()

  const memberSince = profil?.createdAt
    ? new Date(
        typeof profil.createdAt === 'object' && profil.createdAt !== null && 'toDate' in (profil.createdAt as object)
          ? (profil.createdAt as { toDate(): Date }).toDate()
          : new Date(String(profil.createdAt))
      )
    : null
  const memberEnd = memberSince ? new Date(memberSince.getTime() + 14 * 24 * 60 * 60 * 1000) : null

  return (
    <div className="flex flex-col gap-5 p-4 pt-4 lg:flex-row">
      {/* Sol kolon — orijinal left-pane-width */}
      <div className="flex w-full flex-col gap-5 lg:w-[420px] lg:shrink-0">
        {/* summary-card — HESABINIZ */}
        <section className="ads-card flex-1">
          <div className="header">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.6px] text-[#8a8f98]">Hesabınız</h3>
          </div>
          <div className="content">
            <div className="title flex items-start justify-between gap-3">
              <span className="plan rounded-lg bg-[#fdecec] px-2.5 py-1 text-[12px] font-semibold text-[#c92c2c]">Aktif Paketiniz</span>
              <span className="subtitle text-right">
                <b className="block text-[15px] text-[#303030]">Trial paket</b>
                <p className="mt-0.5 text-[12px] text-[#303030] opacity-60">Sınırsız Kullanıcı</p>
              </span>
            </div>
            <div className="line h-px w-full bg-[#ebedf0]" />
            <div className="dates flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between">
                <span className="text-[13px] text-[#303030] opacity-60">Üyelik Tarihiniz</span>
                <span className="mt-0.5 text-[13.5px] font-medium text-[#303030]">{memberSince ? fmt(memberSince) : '—'}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between">
                <span className="text-[13px] text-[#303030] opacity-60">Üyelik Bitiş Tarihiniz</span>
                <span className="mt-0.5 text-[13.5px] font-medium text-[#303030]">{memberEnd ? fmt(memberEnd) : '—'}</span>
              </div>
            </div>
          </div>
          <button type="button" className="btn-theme px-3 py-2.5 text-[13.5px]">Süreyi Uzat/Ödeme Yap</button>
        </section>

        {/* manage-payment — ÖDEME YÖNETİMİ */}
        <section className="ads-card flex-1">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-[15px] font-bold tracking-[0.4px] text-[#303030]">ÖDEME YÖNETİMİ</h2>
            <button type="button" className="edit-btn flex items-center gap-1.5 text-[13px] font-medium text-[#c92c2c] hover:opacity-80" aria-label="Düzenle">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
              </svg>
              <span className="edit-text">Düzenle</span>
            </button>
          </div>

          <div className="section flex flex-col gap-2">
            <div className="label text-[12.5px] font-semibold text-[#8a8f98]">Ödeme Metodu</div>
            <div className="no-info flex flex-col items-center gap-1 rounded-lg bg-[#fafafa] px-4 py-5 text-center">
              <span className="link-button cursor-pointer text-[13.5px] font-semibold text-[#c92c2c] hover:underline">+ Kartınızı Kaydedin</span>
              <p className="description text-[12.5px] leading-relaxed text-neutral-400">Kartınızı kaydedin, ödemelerinizi hızlı ve zahmetsiz yapın.</p>
            </div>
          </div>

          <div className="section flex flex-col gap-2">
            <div className="label text-[12.5px] font-semibold text-[#8a8f98]">Talimat Detayları</div>
            <div className="no-info flex flex-col items-center gap-1 rounded-lg bg-[#fafafa] px-4 py-5 text-center">
              <span className="link-button cursor-pointer text-[13.5px] font-semibold text-[#c92c2c] hover:underline">+ Otomatik Ödeme Talimatı Verin</span>
              <p className="description text-[12.5px] leading-relaxed text-neutral-400">Belirlediğiniz karttan düzenli tahsilat yapılır; ödeme gecikmesi ya da hizmet kesintisi riski ortadan kalkar.</p>
            </div>
          </div>

          <div className="section flex flex-col gap-2">
            <div className="label text-[12.5px] font-semibold text-[#8a8f98]">Fatura Bilgileri</div>
          </div>
        </section>
      </div>

      {/* Sağ kolon — orijinal right-pane-width */}
      <div className="flex min-h-[280px] flex-1 flex-col gap-5">
        {/* payments — ÖDEMELER */}
        <section className="ads-card flex-1">
          <div className="header">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.6px] text-[#8a8f98]">Ödemeler</h3>
          </div>
          <div className="scroll-style content flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#ebedf0]">
                  <th style={{ width: '15%' }} className="pb-2.5 text-left text-[12px] font-semibold lowercase text-[#8a8f98]">durumu</th>
                  <th style={{ width: '15%' }} className="pb-2.5 text-left text-[12px] font-semibold lowercase text-[#8a8f98]">Plan</th>
                  <th style={{ width: '30%' }} className="pb-2.5 text-left text-[12px] font-semibold lowercase text-[#8a8f98]">Entegrasyonlar</th>
                  <th style={{ width: '10%' }} className="pb-2.5 text-left text-[12px] font-semibold lowercase text-[#8a8f98]">tutar</th>
                  <th style={{ width: '15%' }} className="pb-2.5 text-left text-[12px] font-semibold lowercase text-[#8a8f98]">Ödeme Tarihi</th>
                  <th style={{ width: '15%' }} className="pb-2.5 text-left text-[12px] font-semibold lowercase text-[#8a8f98]">ödeme tipi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="pt-3 text-[15px] font-semibold text-[#303030]">Kayıtlı ödeme bulunamadı!</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Hesap bilgileri kartı */}
        <section className="ads-card">
          <div className="header">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.6px] text-[#8a8f98]">Hesap Bilgileri</h3>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            <div>
              <p className="text-[12.5px] text-[#303030] opacity-60">Restoran Adı</p>
              <p className="text-[14px] font-semibold text-[#303030]">{BRAND.restaurantName}</p>
            </div>
            <div>
              <p className="text-[12.5px] text-[#303030] opacity-60">İşletme No</p>
              <p className="text-[14px] font-semibold text-[#303030]">{BRAND.accountCode}</p>
            </div>
            <div>
              <p className="text-[12.5px] text-[#303030] opacity-60">E-posta</p>
              <p className="text-[14px] font-semibold text-[#303030]">{user?.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-[12.5px] text-[#303030] opacity-60">Yetkili</p>
              <p className="text-[14px] font-semibold text-[#303030]">{profil?.name ?? user?.displayName ?? '—'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
