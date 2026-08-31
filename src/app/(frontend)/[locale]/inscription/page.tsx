import { redirect, notFound } from 'next/navigation'
import { isValidLocale, paths } from '@/lib/i18n'
import { getCustomer } from '@/lib/auth/getCustomer'
import { sanitizeRedirect } from '@/lib/auth/sanitizeRedirect'
import SignupForm from '@/components/auth/SignupForm'

type Params = { locale: string }
type SearchParams = { redirect?: string | string[] }

export default async function InscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const { redirect: redirectParam } = await searchParams
  const target = sanitizeRedirect(redirectParam, paths.home(locale))

  const customer = await getCustomer()
  if (customer) redirect(target)

  return <SignupForm locale={locale} redirectTarget={target} />
}
