// QR menü — müşterilerin masa üzerinden eriştiği açık sayfa (oturum gerekmez)
import { MenuView } from '@/components/pos/menu-view'

export const metadata = { title: 'Dijital Menü' }

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-background">
      <MenuView />
    </div>
  )
}
