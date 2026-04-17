import type { SanitizedCompoundIndex } from '../collections/config/types.js'

export const buildVersionCompoundIndexes = ({
  indexes,
}: {
  indexes: SanitizedCompoundIndex[]
}): SanitizedCompoundIndex[] => {
  return indexes.map((each) => ({
    fields: each.fields.map(({ field, localizedPath, path, pathHasLocalized }) => ({
      field,
      localizedPath: `version.${localizedPath}`,
      path: `version.${path}`,
      pathHasLocalized,
    })),
    unique: false,
  }))
}
