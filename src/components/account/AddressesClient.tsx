'use client'

import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/lib/i18n'
import { getNavDict } from '@/lib/i18n'
import { governorates } from '@/lib/governorates'
import Field from '@/components/form/Field'
import { updateAddresses } from '@/lib/account/updateAddresses'
import type { AddressInput, SavedAddress } from '@/lib/account/updateAddresses'

const emptyForm: AddressInput = { label: '', line1: '', city: '', governorate: '', phone: '' }

type FormErrors = { line1?: string; city?: string; governorate?: string }

export default function AddressesClient({
  locale,
  initialAddresses,
}: {
  locale: Locale
  initialAddresses: SavedAddress[]
}) {
  const nav = getNavDict(locale)
  const router = useRouter()

  const [addresses, setAddresses] = useState(initialAddresses)
  const [editingIndex, setEditingIndex] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<AddressInput>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  function openAdd() {
    setForm(emptyForm)
    setErrors({})
    setEditingIndex('new')
  }

  function openEdit(index: number) {
    const a = addresses[index]
    setForm({ label: a.label ?? '', line1: a.line1, city: a.city, governorate: a.governorate, phone: a.phone ?? '' })
    setErrors({})
    setEditingIndex(index)
  }

  function validate(): FormErrors {
    const next: FormErrors = {}
    if (!form.line1.trim()) next.line1 = nav.champRequis
    if (!form.city.trim()) next.city = nav.champRequis
    if (!form.governorate) next.governorate = nav.champRequis
    return next
  }

  async function handleSave() {
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const result =
        editingIndex === 'new'
          ? await updateAddresses({ type: 'add', address: form })
          : await updateAddresses({ type: 'edit', index: editingIndex as number, address: form })
      if (result.ok) {
        setAddresses(result.addresses)
        setEditingIndex(null)
        router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(index: number) {
    if (typeof window !== 'undefined' && !window.confirm(nav.confirmerSuppressionAdresse)) return
    setPendingAction(`remove-${index}`)
    try {
      const result = await updateAddresses({ type: 'remove', index })
      if (result.ok) {
        setAddresses(result.addresses)
        router.refresh()
      }
    } finally {
      setPendingAction(null)
    }
  }

  async function handleSetDefault(index: number) {
    setPendingAction(`default-${index}`)
    try {
      const result = await updateAddresses({ type: 'setDefault', index })
      if (result.ok) {
        setAddresses(result.addresses)
        router.refresh()
      }
    } finally {
      setPendingAction(null)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleSave()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {addresses.length === 0 && editingIndex === null && <p className="text-muted">{nav.aucuneAdresseEnregistree}</p>}

      {addresses.length > 0 && (
        <ul className="flex flex-col gap-4">
          {addresses.map((address, index) => (
            <li key={index} className="rounded-2xl border border-glaze-light p-5">
              {index === 0 && (
                <span className="mb-2 inline-block rounded-sm bg-glaze-light px-1.5 py-0.5 text-xs text-glaze-dark">
                  {nav.adresseParDefaut}
                </span>
              )}
              {address.label && <div className="text-sm text-glaze">{address.label}</div>}
              <div className="text-ink">
                {address.line1}, {address.city}
              </div>
              <div className="text-sm text-muted">
                {address.governorate}
                {address.phone ? ` · ${address.phone}` : ''}
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <button type="button" onClick={() => openEdit(index)} className="text-glaze-deep hover:underline">
                  {nav.modifier}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={pendingAction === `remove-${index}`}
                  className="text-rim-brown hover:underline disabled:opacity-50"
                >
                  {nav.supprimer}
                </button>
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(index)}
                    disabled={pendingAction === `default-${index}`}
                    className="text-muted hover:text-ink disabled:opacity-50"
                  >
                    {nav.definirParDefaut}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingIndex === null ? (
        <button
          type="button"
          onClick={openAdd}
          className="self-start rounded-full border border-glaze-light px-6 py-2.5 text-sm text-ink transition-colors hover:border-glaze motion-reduce:transition-none"
        >
          {nav.ajouterUneAdresse}
        </button>
      ) : (
        <div className="rounded-2xl border border-glaze-light p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              id="addr-label"
              label={nav.libelleAdresse}
              value={form.label ?? ''}
              onChange={(v) => setForm((f) => ({ ...f, label: v }))}
              onKeyDown={handleKeyDown}
              disabled={submitting}
              placeholder={nav.libelleAdressePlaceholder}
              className="sm:col-span-2"
            />
            <Field
              id="addr-line1"
              label={nav.ligne1}
              value={form.line1}
              onChange={(v) => setForm((f) => ({ ...f, line1: v }))}
              onKeyDown={handleKeyDown}
              disabled={submitting}
              error={errors.line1}
              className="sm:col-span-2"
            />
            <Field
              id="addr-city"
              label={nav.ville}
              value={form.city}
              onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              onKeyDown={handleKeyDown}
              disabled={submitting}
              error={errors.city}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="addr-gov" className="text-sm text-muted">
                {nav.gouvernorat}
              </label>
              <select
                id="addr-gov"
                value={form.governorate}
                disabled={submitting}
                onChange={(e) => setForm((f) => ({ ...f, governorate: e.target.value }))}
                aria-invalid={!!errors.governorate}
                className="rounded-lg border border-glaze-light bg-white/60 px-4 py-2.5 text-ink disabled:opacity-60"
              >
                <option value="">—</option>
                {governorates.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              {errors.governorate && <p className="text-sm text-rim-brown">{errors.governorate}</p>}
            </div>
            <Field
              id="addr-phone"
              label={nav.telephone}
              value={form.phone ?? ''}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              onKeyDown={handleKeyDown}
              disabled={submitting}
              className="sm:col-span-2"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="rounded-full bg-ink px-6 py-2.5 text-sm text-paper transition-colors hover:bg-glaze-deep disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            >
              {submitting ? nav.enregistrementEnCours : nav.enregistrer}
            </button>
            <button
              type="button"
              onClick={() => setEditingIndex(null)}
              disabled={submitting}
              className="rounded-full px-6 py-2.5 text-sm text-muted hover:text-ink disabled:opacity-60"
            >
              {nav.annuler}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
