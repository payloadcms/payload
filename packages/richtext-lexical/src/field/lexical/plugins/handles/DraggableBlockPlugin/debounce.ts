export function debounce(func: Function, wait: number) {
  let timeout: null | number = null
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
