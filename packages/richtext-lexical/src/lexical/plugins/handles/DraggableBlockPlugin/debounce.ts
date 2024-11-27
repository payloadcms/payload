'use client'
export function debounce(func: (...args: undefined[]) => void, wait: number) {
  let timeout: number | string | undefined
  return function (...args: undefined[]) {
    const later = () => {
      clearTimeout(timeout)
      timeout = undefined
      func(...args)
    }

    clearTimeout(timeout)
    timeout = window.setTimeout(later, wait)
  }
}
