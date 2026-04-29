export type VisibilityDiff = {
  newlyHidden: string[]
  newlyVisible: string[]
}

export function diffVisibility(
  prev: Map<string, boolean>,
  next: Map<string, boolean>,
): VisibilityDiff {
  const newlyVisible: string[] = []
  const newlyHidden: string[] = []

  for (const [path, visible] of next) {
    const before = prev.get(path) ?? false
    if (!before && visible) {
      newlyVisible.push(path)
    } else if (before && !visible) {
      newlyHidden.push(path)
    }
  }

  for (const [path, visible] of prev) {
    if (!next.has(path) && visible) {
      newlyHidden.push(path)
    }
  }

  return { newlyHidden, newlyVisible }
}
