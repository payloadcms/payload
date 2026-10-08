import type { SharpDynamicDefaults } from './types.js'

/**
 * The per-frame output size. When both dimensions are requested with any `fit` other
 * than `'outside'` this is the requested box, an upper bound (`fit: 'contain'`/`'inside'`
 * or `withoutEnlargement` can render smaller), which is what a resource budget needs.
 * `'outside'` scales to cover the box, so one axis can exceed it.
 */
export function getOutputDimensions({
  fit,
  height,
  sourceHeight,
  sourceWidth,
  width,
  withoutEnlargement,
}: {
  fit: SharpDynamicDefaults['fit']
  height: number | undefined
  sourceHeight: number | undefined
  sourceWidth: number | undefined
  width: number | undefined
  withoutEnlargement: boolean
}): { height: number; width: number } | undefined {
  const hasBothDimensions = width !== undefined && height !== undefined

  if (hasBothDimensions && fit !== 'outside') {
    return { height, width }
  }

  if (!sourceWidth || !sourceHeight) {
    return undefined
  }

  const scale = hasBothDimensions
    ? Math.max(width / sourceWidth, height / sourceHeight)
    : width !== undefined
      ? width / sourceWidth
      : height! / sourceHeight
  const effectiveScale = withoutEnlargement ? Math.min(scale, 1) : scale

  return {
    height: Math.round(sourceHeight * effectiveScale),
    width: Math.round(sourceWidth * effectiveScale),
  }
}
