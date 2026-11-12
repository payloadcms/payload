import type { WidgetWidth } from 'payload'

/* eslint-disable perfectionist/sort-objects */
export const WIDTH_TO_PERCENTAGE = {
  'x-small': 25,
  small: (1 / 3) * 100,
  medium: 50,
  large: (2 / 3) * 100,
  'x-large': 75,
  full: 100,
} as const

export function getResizedWidgetWidth({
  containerWidth,
  delta,
  maxWidth,
  minWidth,
  startWidth,
}: {
  containerWidth: number
  delta: number
  maxWidth: WidgetWidth
  minWidth: WidgetWidth
  startWidth: WidgetWidth
}): WidgetWidth {
  if (containerWidth <= 0) {
    return startWidth
  }

  const targetPercentage = WIDTH_TO_PERCENTAGE[startWidth] + (delta / containerWidth) * 100
  const options = (Object.keys(WIDTH_TO_PERCENTAGE) as WidgetWidth[]).filter(
    (width) =>
      WIDTH_TO_PERCENTAGE[width] >= WIDTH_TO_PERCENTAGE[minWidth] &&
      WIDTH_TO_PERCENTAGE[width] <= WIDTH_TO_PERCENTAGE[maxWidth],
  )

  return options.reduce(
    (nearest, width) =>
      Math.abs(WIDTH_TO_PERCENTAGE[width] - targetPercentage) <
      Math.abs(WIDTH_TO_PERCENTAGE[nearest] - targetPercentage)
        ? width
        : nearest,
    options[0] ?? startWidth,
  )
}
