'use client'
export function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout
  return function (...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      timeout = null
      func(...args)
    }

    clearTimeout(timeout)
    timeout = window.setTimeout(later, wait)
  }
}
