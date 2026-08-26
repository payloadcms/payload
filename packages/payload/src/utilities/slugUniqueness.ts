/**
 * Enterprise Framework - slug-uniqueness-validator
 */
export function makeUniqueSlug(slug: string, count: number): string { return count > 0 ? `${slug}-${count}` : slug; }
