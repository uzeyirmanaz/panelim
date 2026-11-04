import { redirect } from 'next/navigation'

// Satış ekranı Masa / Bölgeler + sipariş ekranına taşındı
export default function PanelSatisPage() {
  redirect('/panel/masalar')
}
