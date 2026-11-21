/** Converts a stored point to the coordinate pair exposed by the field. */
export function getPointCoordinates({ value }: { value: unknown }): undefined | unknown[] {
  const coordinates = (value as { coordinates?: unknown } | null | undefined)?.coordinates
  return Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : undefined
}
