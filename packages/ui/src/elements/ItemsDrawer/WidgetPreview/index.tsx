'use client'

import type { ClientWidget } from 'payload'
import type { ReactNode } from 'react'

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { ShimmerEffect } from '../../ShimmerEffect/index.js'
import { WidgetPreviewErrorBoundary } from '../WidgetPreviewErrorBoundary/index.js'
import { useWidgetPreview } from '../WidgetPreviewProvider/index.js'
import './index.css'

export function WidgetPreview({ widget }: { widget: ClientWidget }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [component, setComponent] = useState<ReactNode>(null)
  const [scale, setScale] = useState(0)
  const { getPreview } = useWidgetPreview()

  useEffect(() => {
    const root = rootRef.current

    if (!root || widget.preview === false) {
      return
    }
    if (typeof IntersectionObserver !== 'function') {
      const timeout = setTimeout(() => setShouldLoad(true), 0)

      return () => clearTimeout(timeout)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(({ isIntersecting }) => isIntersecting)) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { root: root.closest('.drawer__content-children'), rootMargin: '160px' },
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [widget.preview])

  useEffect(() => {
    if (!shouldLoad || widget.preview === false) {
      return
    }
    let isCurrent = true

    void getPreview({ slug: widget.slug }).then((result) => {
      if (isCurrent) {
        setComponent(result)
        setHasLoaded(true)
      }
    })
    return () => {
      isCurrent = false
    }
  }, [getPreview, shouldLoad, widget.preview, widget.slug])

  useLayoutEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current

    if (!root || !canvas) {
      return
    }
    const measure = () => {
      const style = getComputedStyle(root)
      const width =
        root.clientWidth -
        (parseFloat(style.paddingInlineStart) || 0) -
        (parseFloat(style.paddingInlineEnd) || 0)
      const height =
        root.clientHeight -
        (parseFloat(style.paddingBlockStart) || 0) -
        (parseFloat(style.paddingBlockEnd) || 0)

      if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
        setScale(Math.max(0, Math.min(1, width / canvas.offsetWidth, height / canvas.offsetHeight)))
      }
    }

    measure()
    if (typeof ResizeObserver !== 'function') {
      return
    }
    const observer = new ResizeObserver(measure)

    observer.observe(root)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [component])

  return (
    <div
      aria-hidden="true"
      className="widget-preview"
      data-state={hasLoaded ? 'ready' : shouldLoad ? 'loading' : 'idle'}
      data-widget-slug={widget.slug}
      inert
      ref={rootRef}
    >
      {shouldLoad && !hasLoaded && <ShimmerEffect height="100%" />}
      {component && (
        <div
          className="widget-preview__canvas"
          ref={canvasRef}
          style={{ transform: `scale(${scale})` }}
        >
          <WidgetPreviewErrorBoundary>
            <Suspense fallback={<ShimmerEffect height="100%" />}>{component}</Suspense>
          </WidgetPreviewErrorBoundary>
        </div>
      )}
    </div>
  )
}
