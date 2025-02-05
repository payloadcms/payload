export const getLabelFromPath = (path: (number | string)[]): string => {
  return path
    .filter((pathSegment) => !(typeof pathSegment === 'string' && pathSegment.includes('_index')))
    .reduce<string[]>((acc, part) => {
      if (typeof part === 'number' || (typeof part === 'string' && !isNaN(Number(part)))) {
        // Convert index to 1-based and format as "Array 01", "Array 02", etc.
        const fieldName = acc.pop()
        acc.push(`${fieldName} ${Number(part) + 1}`)
      } else {
        // Capitalize field names
        acc.push(part.charAt(0).toUpperCase() + part.slice(1))
      }
      return acc
    }, [])
    .join(' > ')
}
