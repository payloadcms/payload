import { useEffect, useMemo, useRef, useState } from 'react'

export const usePatchAnimateHeight = ({
  containerRef,
  contentRef,
  duration,
  open,
}: {
  containerRef: React.RefObject<HTMLDivElement>
  contentRef: React.RefObject<HTMLDivElement>
  duration: number
  open: boolean
}): { browserSupportsKeywordAnimation: boolean } => {
  const browserSupportsKeywordAnimation = useMemo(
    () =>
      typeof CSS !== 'undefined' && CSS && CSS.supports
        ? CSS.supports('interpolate-size', 'allow-keywords')
        : false,
    [],
  )

  const hasInitialized = useRef(false)
  const previousOpenState = useRef(open)
  const [isAnimating, setIsAnimating] = useState(false)
  const resizeObserverRef = useRef<null | ResizeObserver>(null)

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current

    if (!container || !content || browserSupportsKeywordAnimation) {
      return
    }

    const setContainerHeight = (height: string) => {
      container.style.height = height
    }

    const handleTransitionEnd = () => {
      if (container) {
        container.style.transition = ''
        container.style.height = open ? 'auto' : '0px'
        setIsAnimating(false)
      }
    }

    const animate = () => {
      if (!hasInitialized.current && open) {
        // Skip animation on first render
        setContainerHeight('auto')
        setIsAnimating(false)
        return
      }

      hasInitialized.current = true

      if (previousOpenState.current !== open) {
        setContainerHeight(open ? '0px' : `${content.scrollHeight}px`)
      }

      // Trigger reflow
      container.offsetHeight // eslint-disable-line @typescript-eslint/no-unused-expressions

      setIsAnimating(true)
      container.style.transition = `height ${duration}ms ease`
      setContainerHeight(open ? `${content.scrollHeight}px` : '0px')

      const onTransitionEnd = () => {
        handleTransitionEnd()
        container.removeEventListener('transitionend', onTransitionEnd)
      }

      container.addEventListener('transitionend', onTransitionEnd)
    }

    animate()
    previousOpenState.current = open

    // Setup ResizeObserver
    resizeObserverRef.current = new ResizeObserver(() => {
      if (isAnimating) {
        container.style.height = open ? `${content.scrollHeight}px` : '0px'
      }
    })
    resizeObserverRef.current.observe(content)

    return () => {
      if (container) {
        container.style.transition = ''
        container.style.height = ''
      }
      resizeObserverRef.current?.disconnect()
    }
  }, [open, duration, containerRef, contentRef, browserSupportsKeywordAnimation])

  return { browserSupportsKeywordAnimation }
}
