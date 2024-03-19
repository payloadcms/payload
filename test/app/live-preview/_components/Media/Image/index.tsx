'use client'

import type { StaticImageData } from 'next/image.js'

import NextImageWithDefault from 'next/image.js'
import React from 'react'

import type { Props as MediaProps } from '../types.js'

import { PAYLOAD_SERVER_URL } from '../../../_api/serverURL.js'
import cssVariables from '../../../cssVariables.js'
import classes from './index.module.scss'

const { breakpoints } = cssVariables

const NextImage = (NextImageWithDefault.default ||
  NextImageWithDefault) as typeof NextImageWithDefault.default

export const Image: React.FC<MediaProps> = (props) => {
  const {
    alt: altFromProps,
    fill,
    imgClassName,
    onClick,
    onLoad: onLoadFromProps,
    priority,
    resource,
    src: srcFromProps,
  } = props

  const [isLoading, setIsLoading] = React.useState(true)

  let width: number | undefined
  let height: number | undefined
  let alt = altFromProps
  let src: StaticImageData | string = srcFromProps || ''

  if (!src && resource && typeof resource !== 'string') {
    const {
      alt: altFromResource,
      filename: fullFilename,
      height: fullHeight,
      width: fullWidth,
    } = resource

    width = fullWidth || undefined
    height = fullHeight || undefined
    alt = altFromResource

    const filename = fullFilename

    src = `${PAYLOAD_SERVER_URL}/api/media/file/${filename}`
  }

  // NOTE: this is used by the browser to determine which image to download at different screen sizes
  const sizes = Object.entries(breakpoints)
    .map(([, value]) => `(max-width: ${value}px) ${value}px`)
    .join(', ')

  return (
    <NextImage
      alt={alt || ''}
      className={[isLoading && classes.placeholder, classes.image, imgClassName]
        .filter(Boolean)
        .join(' ')}
      fill={fill}
      height={!fill ? height : undefined}
      onClick={onClick}
      onLoad={() => {
        setIsLoading(false)
        if (typeof onLoadFromProps === 'function') {
          onLoadFromProps()
        }
      }}
      priority={priority}
      sizes={sizes}
      src={src}
      width={!fill ? width : undefined}
    />
  )
}
