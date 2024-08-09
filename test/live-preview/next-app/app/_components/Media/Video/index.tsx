'use client'

import React, { useEffect, useRef } from 'react'

import { Props as MediaProps } from '../types'

import classes from './index.module.scss'
import { PAYLOAD_SERVER_URL } from '@/app/_api/serverURL'

export const Video = (props: MediaProps) => {
  const { videoClassName, resource, onClick } = props

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
        playsInline
        autoPlay
        muted
        loop
        controls={false}
        className={[classes.video, videoClassName].filter(Boolean).join(' ')}
        onClick={onClick}
        ref={videoRef}
      >
        <source src={`${PAYLOAD_SERVER_URL}/media/${filename}`} />
      </video>
    )
  }

  return null
}
