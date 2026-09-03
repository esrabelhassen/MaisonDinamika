'use client'

import type { KeyboardEvent } from 'react'

// Shared controlled text-input field for the storefront's non-native forms (login,
// signup, checkout, account) — one visual + a11y treatment everywhere.
export default function Field({
  id,
  label,
  value,
  onChange,
  error,
  onKeyDown,
  disabled,
  type = 'text',
  placeholder,
  className = '',
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  disabled?: boolean
  type?: string
  placeholder?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="rounded-lg border border-line bg-paper/60 px-4 py-2.5 text-ink transition-all duration-300 focus:border-glaze focus:shadow-[0_0_0_3px_rgba(94,115,134,0.15)] disabled:opacity-60 motion-reduce:transition-none"
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-rim-brown">
          {error}
        </p>
      )}
    </div>
  )
}
