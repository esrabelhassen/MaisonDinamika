import React from 'react'
import { notFound } from 'next/navigation'
import { isValidLocale, locales } from '@/lib/i18n'
import Header from '@/components/header/Header'
import Footer from '@/components/Footer'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  return (
    <>
      <Header locale={locale} />
      {/* pt-20 offsets the fixed header (h-20); the home page hero pulls itself back
          up with -mt-20 so it still sits full-bleed behind the transparent header. */}
      <main className="pt-20">{children}</main>
      <Footer locale={locale} />
    </>
  )
}
