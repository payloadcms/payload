// IntersectionObserver Polyfill for Storybook
// This polyfill provides a simple implementation that immediately reports all elements as intersecting

if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  class IntersectionObserverPolyfill {
    private callback: (entries: any[]) => void
    private elements: Set<Element> = new Set()

    constructor(callback: (entries: any[]) => void, options: any = {}) {
      this.callback = callback
    }

    observe(element: Element) {
      this.elements.add(element)
      // Immediately fire callback with element as intersecting
      // Use setTimeout to avoid synchronous execution issues
      setTimeout(() => {
        this.callback([{
          target: element,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: element.getBoundingClientRect(),
          rootBounds: null,
          intersectionRect: element.getBoundingClientRect(),
          time: Date.now()
        }])
      }, 0)
    }

    unobserve(element: Element) {
      this.elements.delete(element)
    }

    disconnect() {
      this.elements.clear()
    }
  }

  // @ts-ignore
  window.IntersectionObserver = IntersectionObserverPolyfill
}