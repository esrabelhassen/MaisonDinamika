'use client'

import { useEffect } from 'react'
import type { RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Minimal focus trap for a dropdown/drawer: Tab cycles within the container,
 * Escape calls onEscape (the caller closes + returns focus to the trigger).
 * No-op while `active` is false.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape: () => void,
) {
  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape()
        return
      }
      if (event.key !== 'Tab' || !container) return

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onEscape])
}

/** Closes the panel when a pointer event lands outside both the panel and its trigger. */
export function useClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
  active: boolean,
  onOutside: () => void,
) {
  useEffect(() => {
    if (!active) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      const isInside = refs.some((ref) => ref.current?.contains(target))
      if (!isInside) onOutside()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onOutside])
}

/** Locks body scroll while a drawer/modal is open. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [active])
}
