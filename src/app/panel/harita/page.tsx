import { redirect } from 'next/navigation'

// Harita görünümü Masa / Bölgeler ekranına taşındı
export default function PanelHaritaPage() {
  redirect('/panel/masalar')
}
