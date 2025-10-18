export const defaultSlugify = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/\W+/g, '-') // Replace spaces and non-word chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}
