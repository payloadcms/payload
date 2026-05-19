import { useCallback, useEffect, useRef, useState } from 'react'

import { ShimmerEffect } from '../ShimmerEffect/index.js'
import './index.scss'

export type IframeLoaderProps = {
  ref?: React.Ref<HTMLIFrameElement>
} & React.IframeHTMLAttributes<HTMLIFrameElement>

const shimmerDelays = {
  minVisible: 300,
  show: 1000,
}

const baseClass = 'iframe-loader'

/**
 * Loads an `iframe` element with the given source behind a loading indicator.
 * Notable behaviors:
 * 1. Only show if the load takes longer than x ms.
 * 2. Once shown, force it to be visible for at least x ms to avoid flickering, even if the iframe loads before then.
 */
export const IframeLoader: React.FC<IframeLoaderProps> = ({
  onLoad: onLoadFromProps,
  src,
  title,
  ...rest
}) => {
  const [isLoading, setIsLoading] = useState(Boolean(src))
  const [showShimmer, setShowShimmer] = useState(false)
  const shimmerShownAtRef = useRef(0)

  const showTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  const hideTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    clearTimers()
    setIsLoading(Boolean(src))
    setShowShimmer(false)
    shimmerShownAtRef.current = 0

    if (!src) {
      return
    }

    showTimerRef.current = setTimeout(() => {
      setShowShimmer(true)
      shimmerShownAtRef.current = Date.now()
      showTimerRef.current = null
    }, shimmerDelays.show)

    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current)
        showTimerRef.current = null
      }
    }
  }, [clearTimers, src])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const onLoad = useCallback<React.IframeHTMLAttributes<HTMLIFrameElement>['onLoad']>(
    (e) => {
      if (typeof onLoadFromProps === 'function') {
        onLoadFromProps(e)
      }

      setIsLoading(false)

      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current)
        showTimerRef.current = null
      }

      if (!showShimmer) {
        return
      }

      const elapsed = Date.now() - shimmerShownAtRef.current
      const remainingVisible = Math.max(0, shimmerDelays.minVisible - elapsed)

      if (remainingVisible === 0) {
        setShowShimmer(false)
        return
      }

      hideTimerRef.current = setTimeout(() => {
        setShowShimmer(false)
        hideTimerRef.current = null
      }, remainingVisible)
    },
    [showShimmer, onLoadFromProps],
  )

  return (
    <div className={`${baseClass}__container`}>
      {showShimmer && <ShimmerEffect aria-live="polite" height="100%" role="status" transparent />}
      <iframe
        {...rest}
        className={[`${baseClass}__iframe`, isLoading && `${baseClass}__iframe--is-loading`]
          .filter(Boolean)
          .join(' ')}
        onLoad={onLoad}
        // eslint-disable-next-line
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
        src={src}
        title={title}
      />
    </div>
  )
}
