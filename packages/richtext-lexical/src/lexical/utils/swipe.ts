'use client'
type Force = [number, number]
type Listener = (force: Force, e: TouchEvent) => void
interface ElementValues {
  handleTouchend: (e: TouchEvent) => void
  handleTouchstart: (e: TouchEvent) => void
  listeners: Set<Listener>
  start: Force | null
}

const elements = new WeakMap<HTMLElement, ElementValues>()

function readTouch(e: TouchEvent): [number, number] | null {
  const touch = e.changedTouches[0]
  if (touch === undefined) {
    return null
  }
  return [touch.clientX, touch.clientY]
}

function addListener(element: HTMLElement, cb: Listener): () => void {
  let elementValues = elements.get(element)
  if (elementValues === undefined) {
    const listeners = new Set<Listener>()
    const handleTouchstart = (e: TouchEvent): void => {
      if (elementValues !== undefined) {
        elementValues.start = readTouch(e)
      }
    }
    const handleTouchend = (e: TouchEvent): void => {
      if (elementValues === undefined) {
        return
      }
      const { start } = elementValues
      if (start === null) {
        return
      }
      const end = readTouch(e)
      for (const listener of listeners) {
        if (end !== null) {
          listener([end[0] - start[0], end[1] - start[1]], e)
        }
      }
    }
    element.addEventListener('touchstart', handleTouchstart)
    element.addEventListener('touchend', handleTouchend)

    elementValues = {
      handleTouchend,
      handleTouchstart,
      listeners,
      start: null,
    }
    elements.set(element, elementValues)
  }
  elementValues.listeners.add(cb)
  return () => {
    deleteListener(element, cb)
  }
}

function deleteListener(element: HTMLElement, cb: Listener): void {
  const elementValues = elements.get(element)
  if (elementValues === undefined) {
    return
  }
  const { listeners } = elementValues
  listeners.delete(cb)
  if (listeners.size === 0) {
    elements.delete(element)
    element.removeEventListener('touchstart', elementValues.handleTouchstart)
    element.removeEventListener('touchend', elementValues.handleTouchend)
  }
}

export function addSwipeLeftListener(
  element: HTMLElement,
  cb: (_force: number, e: TouchEvent) => void,
): () => void {
  return addListener(element, (force, e) => {
    const [x, y] = force
    if (x < 0 && -x > Math.abs(y)) {
      cb(x, e)
    }
  })
}

export function addSwipeRightListener(
  element: HTMLElement,
  cb: (_force: number, e: TouchEvent) => void,
): () => void {
  return addListener(element, (force, e) => {
    const [x, y] = force
    if (x > 0 && x > Math.abs(y)) {
      cb(x, e)
    }
  })
}

export function addSwipeUpListener(
  element: HTMLElement,
  cb: (_force: number, e: TouchEvent) => void,
): () => void {
  return addListener(element, (force, e) => {
    const [x, y] = force
    if (y < 0 && -y > Math.abs(x)) {
      cb(x, e)
    }
  })
}

export function addSwipeDownListener(
  element: HTMLElement,
  cb: (_force: number, e: TouchEvent) => void,
): () => void {
  return addListener(element, (force, e) => {
    const [x, y] = force
    if (y > 0 && y > Math.abs(x)) {
      cb(x, e)
    }
  })
}
