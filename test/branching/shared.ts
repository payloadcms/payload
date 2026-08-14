/** Phase 0 spike probes — see spike.config.ts */
export const antiJoinProbeSlug = 'anti-join-probe'
export const sentinelProbeSlug = 'sentinel-probe'
export const latestProbeSlug = 'latest-probe'

/** Branching feature suite */
export const postsSlug = 'posts'
export const pagesSlug = 'pages'
export const mediaSlug = 'media'
export const categoriesSlug = 'categories'
export const uniqueSlug = 'unique-docs'
export const numericIDSlug = 'numeric-id-docs'
export const customIDSlug = 'custom-id-docs'
export const excludedSlug = 'excluded-docs'
export const restrictedSlug = 'restricted-docs'
/** Public read access, as a real public website has — the shape branch reads must not leak through. */
export const publicSlug = 'public-docs'
/** `maxPerDoc`, so version pruning on a branch has something to prune. */
export const maxVersionsSlug = 'max-versions-docs'
/** Autosave, which reaches `updateLatestVersion` — the one version write that is not branch-aware. */
export const autosaveSlug = 'autosave-docs'
/** Localized and nested fields: per-locale forking, and the sub-table write paths. */
export const localizedSlug = 'localized-docs'
export const nestedSlug = 'nested-docs'

export const headerGlobalSlug = 'header'
export const homepageGlobalSlug = 'homepage'

/** Core-owned branching collections */
export const branchesSlug = 'payload-branches'
export const branchChangesSlug = 'payload-branch-changes'
export const branchMergesSlug = 'payload-branch-merges'
export const whereAccessSlug = 'where-access-docs'
