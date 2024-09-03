'use client'
import * as React from 'react'

import { useDelay } from '../../hooks/useDelay.js'
import './index.scss'

export type ShimmerEffectProps = {
  readonly animationDelay?: string
  readonly height?: number | string
  readonly width?: number | string
}

export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  animationDelay = '0ms',
  height = '60px',
  width = '100%',
}) => {
  return (
    <div
      className="shimmer-effect"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
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
