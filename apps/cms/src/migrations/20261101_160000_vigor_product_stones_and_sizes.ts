import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'

/**
 * Vigor products had one gemstone (`stone`); they now have a list (`stones`) and a list of sizes
 * (`sizes`). Moves each product's gemstone into the list, in the products and in their saved
 * versions and drafts. "Various stones", which only stood for "several stones", becomes an empty
 * list: scripts/import-legacy-catalog.ts fills in the stones of the old website's products.
 *
 * Runs once by itself when the CMS starts in production (prodMigrations in payload.config.ts);
 * locally, run `pnpm payload migrate`.
 */
export async function up({ payload, session }: MigrateUpArgs): Promise<void> {
  const fromStone = (field: string, list: string) => ({
    $cond: [
      { $and: [{ $isArray: list }, { $gt: [{ $size: list }, 0] }] },
      list,
      { $cond: [{ $in: [{ $ifNull: [field, ''] }, ['', 'Various stones']] }, [], [field]] },
    ],
  })

  const products = await payload.db.collections['vigor-products'].collection.updateMany(
    { stone: { $exists: true } },
    [{ $set: { stones: fromStone('$stone', '$stones') } }, { $unset: 'stone' }],
    { session },
  )
  const versions = await payload.db.versions['vigor-products'].collection.updateMany(
    { 'version.stone': { $exists: true } },
    [
      { $set: { 'version.stones': fromStone('$version.stone', '$version.stones') } },
      { $unset: 'version.stone' },
    ],
    { session },
  )

  payload.logger.info(
    `Vigor products: moved the gemstone into the list of gemstones on ${products.modifiedCount} products and ${versions.modifiedCount} versions`,
  )
}

export async function down({ payload, session }: MigrateDownArgs): Promise<void> {
  const firstStone = (list: string) => ({ $ifNull: [{ $arrayElemAt: [list, 0] }, ''] })

  await payload.db.collections['vigor-products'].collection.updateMany(
    { stones: { $exists: true } },
    [{ $set: { stone: firstStone('$stones') } }, { $unset: ['stones', 'sizes'] }],
    { session },
  )
  await payload.db.versions['vigor-products'].collection.updateMany(
    { 'version.stones': { $exists: true } },
    [
      { $set: { 'version.stone': firstStone('$version.stones') } },
      { $unset: ['version.stones', 'version.sizes'] },
    ],
    { session },
  )
}
