export const slugify = (val?: string): string | undefined =>
  val
    ?.trim()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()
