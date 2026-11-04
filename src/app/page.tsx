'use client'

// Ana sayfa — doğrudan giriş ekranına yönlenir (statik export uyumlu)
import { withBase } from '@/lib/utils'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/config/brand'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/giris')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <a href={withBase('/giris/')} className="text-[15px] font-medium text-brand-600 hover:underline">
        {BRAND.name} paneline giriş için tıklayın…
      </a>
    </div>
  )
}
