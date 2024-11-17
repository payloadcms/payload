'use client'

import React, { useEffect, useRef } from 'react'

import type { Props as MediaProps } from '../types.js'

import { PAYLOAD_SERVER_URL } from '../../../_api/serverURL.js'
import classes from './index.module.scss'

export const Video: React.FC<MediaProps> = (props) => {
  const { onClick, resource, videoClassName } = props

  const videoRef = useRef<HTMLVideoElement>(null)
  // const [showFallback] = useState<boolean>()

  useEffect(() => {
    const { current: video } = videoRef
    if (video) {
      video.addEventListener('suspend', () => {
        // setShowFallback(true);
        // console.warn('Video was suspended, rendering fallback image.')
      })
    }
  }, [])

  if (resource && typeof resource !== 'string') {
    const { filename } = resource

    return (
      <video
        autoPlay
        className={[classes.video, videoClassName].filter(Boolean).join(' ')}
        controls={false}
        loop
        muted
        onClick={onClick}
        playsInline
        ref={videoRef}
      >
        <source src={`${PAYLOAD_SERVER_URL}/media/${filename}`} />
      </video>
    )
  }

  return null
}
