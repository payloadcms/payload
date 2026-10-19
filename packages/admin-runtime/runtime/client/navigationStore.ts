/**
 * Browser navigation state shared by the browser entry, which owns the RSC root, and the
 * `RouterAdapter` that Payload's UI talks to.
 */
export type NavigateOptions = {
  history: 'none' | 'push' | 'replace'
  scroll?: boolean
}

type Navigator = (url: string, options: NavigateOptions) => Promise<void>

let navigator: Navigator | undefined
let pendingCount = 0
let replacedURL: string | undefined
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((listener) => listener())

export const setNavigator = (fn: Navigator) => {
  navigator = fn
}

export const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getPendingCount = () => pendingCount

/** Set by `replaceState`: the URL changed without a server render. */
export const getReplacedURL = () => replacedURL

export const clearReplacedURL = () => {
  replacedURL = undefined
}

const toAppURL = (path: string) => {
  const url = new URL(path, window.location.href)
  return url.origin === window.location.origin
    ? `${url.pathname}${url.search}${url.hash}`
    : url.href
}

export async function navigate(path: string, options: NavigateOptions): Promise<void> {
  const url = toAppURL(path)

  if (!navigator || url.startsWith('http')) {
    window.location.assign(url)
    return
  }

  pendingCount++
  notify()

  try {
    await navigator(url, options)
  } finally {
    pendingCount--
    notify()
  }
}

export const refresh = () =>
  navigate(`${window.location.pathname}${window.location.search}`, {
    history: 'none',
    scroll: false,
  })

/** Syncs the URL without a server render, like Next's patched `history.replaceState`. */
export const replaceState = (path: string) => {
  replacedURL = toAppURL(path)
  window.history.replaceState(window.history.state, '', replacedURL)
  notify()
}
