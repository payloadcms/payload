import React from 'react'

type NextImageProps = {
  [key: string]: unknown
  alt: string
  blurDataURL?: string
  className?: string
  fill?: boolean
  height?: number
  placeholder?: string
  priority?: boolean
  quality?: number
  src: string
  style?: React.CSSProperties
  width?: number
}

const NextImage = ({
  alt,
  blurDataURL: _blurDataURL,
  fill: _fill,
  height,
  placeholder: _placeholder,
  priority: _priority,
  quality: _quality,
  src,
  width,
  ...props
}: NextImageProps) => {
  return <img alt={alt} height={height} src={src} width={width} {...props} />
}

// eslint-disable-next-line no-restricted-exports -- mock for next/image which requires a default export
export default NextImage
