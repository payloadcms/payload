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
  sort?: string
}
export async function buildFolderWhereConstraints({
  collectionConfig,
  folderID,
  localeCode,
  req,
  search = '',
  sort,
}: Args): Promise<undefined | Where> {
  const constraints: Where[] = [
    mergeListSearchAndWhere({
      collectionConfig,
      search,
      // where // cannot have where since fields in folders and collection will differ
    }),
  ]

  const baseFilterConstraint = await (
    collectionConfig.admin?.baseFilter ?? collectionConfig.admin?.baseListFilter
  )?.({
    limit: 0,
    locale: localeCode,
    page: 1,
    req,
    sort:
      sort ||
      (typeof collectionConfig.defaultSort === 'string' ? collectionConfig.defaultSort : 'id'),
  })

  if (baseFilterConstraint) {
    constraints.push(baseFilterConstraint)
  }

  if (folderID) {
    // build folder join where constraints
    constraints.push({
      relationTo: {
        equals: collectionConfig.slug,
      },
    })

    // join queries need to omit trashed documents
    if (collectionConfig.trash) {
      constraints.push({
        deletedAt: {
          exists: false,
        },
      })
    }
  }

  const filteredConstraints = constraints.filter(Boolean)

  if (filteredConstraints.length > 1) {
    return combineWhereConstraints(filteredConstraints)
  } else if (filteredConstraints.length === 1) {
    return filteredConstraints[0]
  }

  return undefined
}
