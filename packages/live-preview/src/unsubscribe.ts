export const unsubscribe = (callback: (event: MessageEvent) => void) => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('message', callback)
  }
}
