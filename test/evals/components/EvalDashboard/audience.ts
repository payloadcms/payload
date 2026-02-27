/**
 * Audience taxonomy for eval results.
 *
 * - users       — developers who build applications with Payload
 * - admins      — content editors / end-users of the Payload admin panel
 * - maintainers — contributors who maintain or extend Payload itself
 */
export type Audience = 'admins' | 'maintainers' | 'users'

/** Default audience(s) derived from eval category. */
const CATEGORY_AUDIENCES: Record<string, Audience[]> = {
  'access-control': ['users', 'admins'],
  admin: ['admins', 'users'],
  'building-plugins': ['maintainers', 'users'],
  collections: ['users'],
  commits: ['maintainers'],
  config: ['users'],
  conventions: ['maintainers'],
  fields: ['users'],
  graphql: ['users'],
  hooks: ['users'],
  'local-api': ['users'],
  negative: ['maintainers'],
  'official-plugins': ['users'],
  plugins: ['users'],
  'rest-api': ['users'],
  structure: ['maintainers'],
  testing: ['maintainers'],
  translations: ['maintainers'],
}

/** Returns the audience(s) for a given category, defaulting to users for unknown categories. */
export function getAudience(category: string): Audience[] {
  return CATEGORY_AUDIENCES[category.toLowerCase()] ?? ['users']
}

export type AudienceConfig = {
  bg: string
  color: string
  label: string
}

export const AUDIENCE_CONFIG: Record<Audience, AudienceConfig> = {
  admins: { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', label: 'Admin' },
  maintainers: { bg: 'rgba(232,168,56,0.15)', color: '#d4963a', label: 'Maintainer' },
  users: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', label: 'User' },
}
