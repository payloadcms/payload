'use client'

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
        ? Boolean(CSS.supports('interpolate-size', 'allow-keywords'))
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

    let animationFrameId: number

    const updateHeight = () => {
      if (isAnimating && container && content) {
        container.style.height = open ? `${content.scrollHeight}px` : '0px'
      }
    }

    const animate = () => {
      setIsAnimating(true)

      // Skip animation on the first render
      if (!hasInitialized.current) {
        container.style.transition = ''
        container.style.height = open ? 'auto' : '0px'
        hasInitialized.current = true
        setIsAnimating(false)
        return
      }

      // Set initial state
      if (previousOpenState.current !== open) {
        container.style.height = open ? '0px' : `${content.scrollHeight}px`
      }

      // Trigger reflow
      container.offsetHeight // eslint-disable-line @typescript-eslint/no-unused-expressions

      // Start animation
      container.style.transition = `height ${duration}ms ease`
      container.style.height = open ? `${content.scrollHeight}px` : '0px'

      const transitionEndHandler = () => {
        container.style.transition = ''
        container.style.height = open ? 'auto' : '0px'
        container.removeEventListener('transitionend', transitionEndHandler)
        setIsAnimating(false)
      }

      container.addEventListener('transitionend', transitionEndHandler)
    }

    animate()
    previousOpenState.current = open

    // Setup ResizeObserver
    resizeObserverRef.current = new ResizeObserver(() => {
      if (isAnimating) {
        animationFrameId = requestAnimationFrame(updateHeight)
      }
    })

    resizeObserverRef.current.observe(content)

    return () => {
      container.style.transition = ''
      container.style.height = ''
      resizeObserverRef.current?.disconnect()
      cancelAnimationFrame(animationFrameId)
    }
  }, [open, duration, containerRef, contentRef, browserSupportsKeywordAnimation, isAnimating])

  return { browserSupportsKeywordAnimation }
}
