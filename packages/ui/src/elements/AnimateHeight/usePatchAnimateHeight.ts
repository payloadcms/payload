import { useEffect, useMemo, useRef } from 'react'

export const usePatchAnimateHeight = ({
  containerRef,
  duration,
  open,
}: {
  containerRef: React.RefObject<HTMLDivElement>
  duration: number
  open: boolean
}): { browserSupportsKeywordAnimation: boolean } => {
  const browserSupportsKeywordAnimation = useMemo(
    () => (CSS.supports ? Boolean(CSS.supports('interpolate-size', 'allow-keywords')) : false),
    [],
  )

  const previousOpenState = useRef(open)

  useEffect(() => {
    if (containerRef.current && !browserSupportsKeywordAnimation) {
      const container = containerRef.current

      const getTotalHeight = (el: HTMLDivElement) => {
        const styles = window.getComputedStyle(el)
        const marginTop = parseFloat(styles.marginTop)
        const marginBottom = parseFloat(styles.marginBottom)
        return el.scrollHeight + marginTop + marginBottom
      }

      const animate = () => {
        const maxContentHeight = getTotalHeight(container)

        // Set initial state
        if (previousOpenState.current !== open) {
          container.style.height = open ? '0px' : `${maxContentHeight}px`
          container.style.overflow = 'hidden'
        }

        // Trigger reflow
        container.offsetHeight // eslint-disable-line @typescript-eslint/no-unused-expressions

        // Start animation
        container.style.transition = `height ${duration}ms ease`
        container.style.height = open ? `${maxContentHeight}px` : '0px'

        const transitionEndHandler = () => {
          container.style.transition = ''
          container.style.height = open ? 'auto' : '0px'
          container.style.overflow = open ? '' : 'hidden'
          container.removeEventListener('transitionend', transitionEndHandler)
        }

        container.addEventListener('transitionend', transitionEndHandler)
      }

      animate()

      previousOpenState.current = open

      return () => {
        container.style.transition = ''
        container.style.height = ''
        container.style.overflow = ''
      }
    }
  }, [open, duration, containerRef, browserSupportsKeywordAnimation])

  return { browserSupportsKeywordAnimation }
}
