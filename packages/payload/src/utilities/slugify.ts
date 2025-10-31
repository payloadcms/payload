export const slugify = (val?: string) =>
  val
    ?.trim()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()
