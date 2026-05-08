import { useState, useEffect } from 'react'

/**
 * Theme management hook.
 *
 * Behavior:
 * 1. On first visit, defaults to the user's OS preference (prefers-color-scheme).
 * 2. After the user explicitly toggles, their choice is stored in localStorage
 *    and overrides the OS preference on subsequent visits.
 * 3. The chosen theme is applied as `data-theme="light"` on <html>;
 *    CSS in index.css picks up the right palette.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // SSR/Node guard — though Vite is browser-only, this is defensive
    if (typeof window === 'undefined') return 'dark'

    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved

    // No saved choice → respect OS preference
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))

  return { theme, toggle }
}
