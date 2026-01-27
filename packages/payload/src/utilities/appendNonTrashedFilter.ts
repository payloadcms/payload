import type { Where } from '../types/index.js'

export const appendNonTrashedFilter = ({
  deletedAtPath = 'deletedAt',
  enableTrash,
  trash,
  where,
}: {
  deletedAtPath?: string
  enableTrash: boolean
  trash?: boolean
  where: Where
}): Where => {
  if (!enableTrash || trash) {
    return where
  }

  const notTrashedFilter = {
    [deletedAtPath]: { exists: false },
  }

  if (where?.and) {
    return {
      ...where,
      and: [...where.and, notTrashedFilter],
    }
  }

  return {
    and: [notTrashedFilter, ...(where ? [where] : [])],
  }
}
