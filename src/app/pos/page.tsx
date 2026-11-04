import { redirect } from 'next/navigation'

// Eski tek sayfa POS girişi panele taşındı
export default function PosRedirectPage() {
  redirect('/panel')
}
