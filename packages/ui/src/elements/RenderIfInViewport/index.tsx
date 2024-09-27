'use client'
import React from 'react'

import { useIntersect } from '../../hooks/useIntersect.js'

export const RenderIfInViewport: React.FC<{
  children: React.ReactNode
  className?: string
  forceRender?: boolean
}> = ({ children, className, forceRender }) => {
  const [hasRendered, setHasRendered] = React.useState(Boolean(forceRender))
  const [intersectionRef, entry] = useIntersect(
    {
      rootMargin: '1000px',
    },
    Boolean(forceRender),
  )

  const isIntersecting = Boolean(entry?.isIntersecting)
  const isAboveViewport = entry?.boundingClientRect?.top < 0
  const shouldRender = forceRender || isIntersecting || isAboveViewport

  React.useEffect(() => {
    if (shouldRender && !hasRendered) {
      setHasRendered(true)
    }
  }, [shouldRender, hasRendered])

  return (
    <div className={className} ref={intersectionRef}>
      {hasRendered ? children : null}
    </div>
  )
}
