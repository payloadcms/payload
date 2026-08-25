/**
 * Payload CMS - Unique Slug Collision Resolver
 */
export function resolveUniqueSlugCandidate(baseSlug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(baseSlug)) return baseSlug;
  let counter = 1;
  while (existingSlugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }
  return `${baseSlug}-${counter}`;
}
