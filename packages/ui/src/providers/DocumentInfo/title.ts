'use client'

import { useSyncExternalStore } from 'react'

let documentTitle = '' // Default initial state
const listeners = new Set<() => void>()

export const initializeDocumentTitle = (initialTitle: string) => {
  if (!documentTitle) {
    documentTitle = initialTitle
  }
}

export const setDocumentTitle = (newTitle: string) => {
  documentTitle = newTitle
  listeners.forEach((listener) => listener())
}

export const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useDocumentTitle = () => {
  return {
    setTitle: setDocumentTitle,
    title: useSyncExternalStore(
      subscribe,
      () => documentTitle,
      () => documentTitle,
    ),
  }
}
