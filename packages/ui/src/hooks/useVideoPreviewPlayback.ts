'use client'
import type React from 'react'

import { useEffect } from 'react'

import { VIDEO_FRAME_TIME } from '../utilities/getVideoThumbnailSrc.js'

/** Time to wait before playing, so a pointer that only passes over a card starts no download. */
export const VIDEO_PREVIEW_PLAY_DELAY_MS = 300

/**
 * Play a muted video thumbnail while `isActive`, then return it to its thumbnail frame.
 * Does nothing when the user prefers reduced motion.
 */
export const useVideoPreviewPlayback = ({
  delayMs = VIDEO_PREVIEW_PLAY_DELAY_MS,
  isActive,
  videoRef,
}: {
  delayMs?: number
  isActive: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
}): void => {
  useEffect(() => {
    const video = videoRef.current

    if (!isActive || !video || prefersReducedMotion()) {
      return
    }

    let hasStarted = false
    const timeoutID = setTimeout(() => {
      hasStarted = true
      // A pause before playback starts rejects with an AbortError, which needs no handling
      video.play().catch(() => undefined)
    }, delayMs)

    return () => {
      clearTimeout(timeoutID)

      if (!hasStarted) {
        return
      }

      video.pause()
      video.currentTime = VIDEO_FRAME_TIME
    }
  }, [delayMs, isActive, videoRef])
}

function prefersReducedMotion(): boolean {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}
