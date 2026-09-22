import type { PayloadRequest, SelectType } from '../../../types/index.js'
import type { TypeWithVersion } from '../../../versions/types.js'
import type { Collection, TypeWithID } from '../../config/types.js'

import { appendNonTrashedFilter } from '../../../utilities/appendNonTrashedFilter.js'
import { getSelectMode } from '../../../utilities/getSelectMode.js'

export const prefetchVersionForInheritedReadAccess = async <TData extends TypeWithID>({
  id,
  collectionConfig,
  locale,
  req,
  select,
  trash,
}: {
  collectionConfig: Collection['config']
  id: number | string
  locale: string
  req: PayloadRequest
  select?: SelectType
  trash: boolean
}): Promise<{
  parentID?: TypeWithVersion<TData>['parent']
  version?: TypeWithVersion<TData>
}> => {
  const selectMode = select ? getSelectMode(select) : undefined
  const shouldOmitParent = Boolean(
    select && ((selectMode === 'include' && select.parent !== true) || select.parent === false),
  )
  let prefetchSelect = select

  if (select && selectMode === 'include') {
    prefetchSelect = { ...select, parent: true }
  } else if (select?.parent === false) {
    prefetchSelect = { ...select }
    delete prefetchSelect.parent
  }

  const { docs } = await req.payload.db.findVersions<TData>({
    collection: collectionConfig.slug,
    limit: 1,
    locale,
    pagination: false,
    req,
    select: prefetchSelect,
    where: appendNonTrashedFilter({
      deletedAtPath: 'version.deletedAt',
      enableTrash: collectionConfig.trash,
      trash,
      where: { id: { equals: id } },
    }),
  })
  const version = docs[0]
  const parentID = version?.parent

  if (version && shouldOmitParent) {
    const versionWithoutParent = { ...version }
    delete (versionWithoutParent as Partial<TypeWithVersion<TData>>).parent

    return { parentID, version: versionWithoutParent }
  }

  return { parentID, version }
}
