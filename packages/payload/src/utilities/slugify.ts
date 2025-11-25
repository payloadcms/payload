export const slugify: Slugify = (val) =>
  val
    ?.replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()

export type Slugify = (val?: string) => Promise<string | undefined> | string | undefined
