import { FieldHook, Where } from 'payload'

/**
 * This is a cross-entity way to count the number of versions for any given document.
 * It will work for both collections and globals.
 * @returns number of versions
 */
export const countVersions = async (args: Parameters<FieldHook>[0]): Promise<number> => {
  const { collection, req, global, originalDoc } = args

  let countFn

  const where: Where = {
    parent: {
      equals: originalDoc?.id,
    },
  }

  if (collection) {
    countFn = () =>
      req.payload.countVersions({
        collection: collection.slug,
        where,
        depth: 0,
      })
  }

  if (global) {
    countFn = () =>
      req.payload.countGlobalVersions({
        global: global.slug,
        where,
        depth: 0,
      })
  }

  const res = countFn ? (await countFn()?.then((res) => res.totalDocs || 0)) || 0 : 0

  return res
}
