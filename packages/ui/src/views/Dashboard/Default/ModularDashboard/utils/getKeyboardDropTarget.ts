export type KeyboardDropTarget = {
  id: string
  index: number
  x: number
  y: number
}

export function getKeyboardDropTarget<T extends KeyboardDropTarget>({
  currentIndex,
  direction,
  isRTL,
  targets,
  x,
  y,
}: {
  currentIndex: number
  direction: string
  isRTL: boolean
  targets: T[]
  x: number
  y: number
}): T | undefined {
  if (direction === 'ArrowLeft' || direction === 'ArrowRight') {
    const isForward = (direction === 'ArrowRight') !== isRTL
    const candidates = targets.filter(({ index }) =>
      isForward ? index > currentIndex : index < currentIndex,
    )
    const targetIndex = isForward
      ? Math.min(...candidates.map(({ index }) => index))
      : Math.max(...candidates.map(({ index }) => index))

    return candidates
      .filter(({ index }) => index === targetIndex)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]
  }

  if (direction === 'ArrowDown' || direction === 'ArrowUp') {
    const candidates = targets.filter((target) =>
      direction === 'ArrowDown' ? target.y > y + 5 : target.y < y - 5,
    )

    return candidates.sort(
      (a, b) => Math.abs(a.y - y) - Math.abs(b.y - y) || Math.abs(a.x - x) - Math.abs(b.x - x),
    )[0]
  }

  return undefined
}
