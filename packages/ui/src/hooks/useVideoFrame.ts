'use client'
import type React from 'react'

import { useState } from 'react'

import { VIDEO_FRAME_TIME, VIDEO_LOAD_TIMEOUT_MS } from '../utilities/getVideoThumbnailSrc.js'
import { useDelay } from './useDelay.js'

type VideoFrameStatus = 'error' | 'loaded' | 'loading'

type UseVideoFrameResult = {
  /** `true` while loading, until the timeout passes. */
  isLoading: boolean
  /** `false` after a load error. A video that loads after the timeout still replaces the fallback. */
  shouldRenderVideo: boolean
  /** `true` on a load error, or while loading after the timeout passes. */
  shouldShowFallback: boolean
  /** Spread onto a `<video muted>`, with `muted` set on the element so lint can verify it. */
  videoProps: React.VideoHTMLAttributes<HTMLVideoElement>
}

/**
 * Track the load state of a silent, static video frame used as a thumbnail.
 * Some browsers (e.g. iOS Safari) never load metadata without user interaction, so a timeout
 * shows the fallback instead of an endless loading state.
 */
export const useVideoFrame = ({
  src,
  timeoutMs = VIDEO_LOAD_TIMEOUT_MS,
}: {
  src: string
  timeoutMs?: number
}): UseVideoFrameResult => {
  const [status, setStatus] = useState<VideoFrameStatus>('loading')
  const [hasTimedOut] = useDelay(timeoutMs, true)
  const isPending = status === 'loading'

  return {
    isLoading: isPending && !hasTimedOut,
    shouldRenderVideo: status !== 'error',
    shouldShowFallback: status === 'error' || (isPending && hasTimedOut),
    videoProps: {
      hidden: status !== 'loaded',
      onError: () => setStatus('error'),
      onLoadedMetadata: () => setStatus('loaded'),
      playsInline: true,
      preload: 'metadata',
      src: `${src}#t=${VIDEO_FRAME_TIME}`,
    },
  }
}
