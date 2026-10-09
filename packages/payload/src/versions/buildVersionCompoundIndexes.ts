import type { SanitizedCompoundIndex } from '../collections/config/types.js'

import { branchField } from '../branching/types.js'

export const buildVersionCompoundIndexes = ({
  indexes,
}: {
  indexes: SanitizedCompoundIndex[]
}): SanitizedCompoundIndex[] => {
  return indexes.map((each) => ({
    fields: each.fields.map(({ field, localizedPath, path, pathHasLocalized }) =>
      path === branchField
        ? { field, localizedPath, path, pathHasLocalized }
        : {
            field,
            localizedPath: `version.${localizedPath}`,
            path: `version.${path}`,
            pathHasLocalized,
          },
    ),
    unique: false,
  }))
}
