import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js'
import { mergeListSearchAndWhere } from '../../utilities/mergeListSearchAndWhere.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  folderID?: number | string
  localeCode?: string
  req: PayloadRequest
  search?: string
}
export async function buildFolderWhereConstraints({
  collectionConfig,
  folderID,
  localeCode,
  req,
  search,
}: Args): Promise<undefined | Where> {
  const searchConstraint = mergeListSearchAndWhere({
    collectionConfig,
    search,
    // where // cannot have where since fields in folders and collection will differ
  })

  let baseListFilterConstraint: undefined | Where = undefined
  if (typeof collectionConfig.admin?.baseListFilter === 'function') {
    baseListFilterConstraint = await collectionConfig.admin.baseListFilter({
      limit: 0,
      locale: localeCode,
      page: 1,
      req,
      sort: undefined,
    })
  }

  let relationConstraint: undefined | Where = undefined
  if (folderID) {
    // build folder join where constraints
    relationConstraint = {
      relationTo: {
        equals: collectionConfig.slug,
      },
    }
  }

  const filteredConstraints = [
    searchConstraint,
    baseListFilterConstraint,
    relationConstraint,
  ].filter(Boolean)

  if (filteredConstraints.length > 1) {
    return combineWhereConstraints(filteredConstraints)
  } else if (filteredConstraints.length === 1) {
    return filteredConstraints[0]
  }

  return undefined
}
