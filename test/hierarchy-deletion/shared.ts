export const articlesSlug = 'deletion-articles'
export const contentSlug = 'deletion-content'
export const foldersSlug = 'deletion-folders'
export const pagesSlug = 'deletion-pages'
export const tagsSlug = 'deletion-tags'
export const usersSlug = 'users'
export const folderFieldName = `_h_${foldersSlug}`
export const tagFieldName = `_h_${tagsSlug}`

export const hierarchyPresets = [
  { collection: pagesSlug, parentField: 'parent' },
  { collection: articlesSlug, parentField: 'ancestor' },
  { collection: foldersSlug, parentField: folderFieldName },
  { collection: tagsSlug, parentField: tagFieldName },
] as const

export const localizedPagesSlug = 'deletion-localized-pages'
