import { useEffect, useState } from 'react'

const KEY = 'tally-theme'

function initial(): boolean {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return saved === 'dark'
  } catch {
    // storage blocked: fall through to the OS setting
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Light/dark toggle. Writes data-theme on <html>, which the tokens in global.css read. */
export function useTheme() {
  const [dark, setDark] = useState(initial)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light')
    } catch {
      // ignore
    }
  }, [dark])

  return { dark, toggle: () => setDark((d) => !d) }
}
