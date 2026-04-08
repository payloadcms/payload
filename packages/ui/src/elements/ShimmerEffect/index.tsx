'use client'
import * as React from 'react'

import { useDelay } from '../../hooks/useDelay.js'
import './index.scss'

export type ShimmerEffectProps = {
  readonly animationDelay?: string
  readonly className?: string
  readonly disableInlineStyles?: boolean
  readonly height?: number | string
  /**
   * When true, adjusts the gradient to allow the natural background of the element to shine through.
   */
  transparent?: boolean
  readonly width?: number | string
} & React.HTMLAttributes<HTMLDivElement>

const baseClass = 'shimmer-effect'

export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  animationDelay = '0ms',
  className,
  disableInlineStyles = false,
  height = '60px',
  transparent,
  width = '100%',
  ...rest
}) => {
  return (
    <div
      {...rest}
      className={[baseClass, transparent && `${baseClass}--transparent`, className]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...(rest?.style || {}),
        height: !disableInlineStyles && (typeof height === 'number' ? `${height}px` : height),
        width: !disableInlineStyles && (typeof width === 'number' ? `${width}px` : width),
      }}
    >
      <div
        className="shimmer-effect__shine"
        style={{
          animationDelay,
        }}
      />
    </div>
  )
}

export type StaggeredShimmersProps = {
  className?: string
  count: number
  height?: number | string
  renderDelay?: number
  shimmerDelay?: number | string
  shimmerItemClassName?: string
  width?: number | string
}

export const StaggeredShimmers: React.FC<StaggeredShimmersProps> = ({
  className,
  count,
  height,
  renderDelay = 500,
  shimmerDelay = 25,
  shimmerItemClassName,
  width,
}) => {
  const shimmerDelayToPass = typeof shimmerDelay === 'number' ? `${shimmerDelay}ms` : shimmerDelay
  const [hasDelayed] = useDelay(renderDelay, true)

  if (!hasDelayed) {
    return null
  }

  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <div className={shimmerItemClassName} key={i}>
          <ShimmerEffect
            animationDelay={`calc(${i} * ${shimmerDelayToPass})`}
            height={height}
            width={width}
          />
        </div>
      ))}
    </div>
  )
}
