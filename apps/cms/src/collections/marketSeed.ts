import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Payload } from 'payload'

import type { MarketMaterial } from '../payload-types'

type NewMaterial = Pick<
  MarketMaterial,
  'active' | 'highlight' | 'icon' | 'key' | 'name' | 'sortOrder' | 'symbol' | 'unit'
>

/**
 * What the VgemsAI app's Research tab started with, under its keys, with their Yahoo Finance symbols
 * (futures, which follow the spot price closely): gold, silver, platinum and palladium per troy ounce,
 * copper per pound and Brent crude per barrel, in US dollars.
 */
const STARTING_MATERIALS: NewMaterial[] = [
  {
    name: 'Gold',
    active: true,
    highlight: true,
    icon: 'circle.hexagongrid.fill',
    key: 'gold',
    sortOrder: 1,
    symbol: 'GC=F',
    unit: 'USD/oz',
  },
  {
    name: 'Silver',
    active: true,
    highlight: true,
    icon: 'circle.hexagongrid',
    key: 'silver',
    sortOrder: 2,
    symbol: 'SI=F',
    unit: 'USD/oz',
  },
  {
    name: 'Crude Oil (Brent)',
    active: true,
    highlight: true,
    icon: 'drop.fill',
    key: 'oil',
    sortOrder: 3,
    symbol: 'BZ=F',
    unit: 'USD/bbl',
  },
  {
    name: 'Platinum',
    active: true,
    highlight: false,
    icon: 'seal.fill',
    key: 'platinum',
    sortOrder: 4,
    symbol: 'PL=F',
    unit: 'USD/oz',
  },
  {
    name: 'Palladium',
    active: true,
    highlight: false,
    icon: 'seal',
    key: 'palladium',
    sortOrder: 5,
    symbol: 'PA=F',
    unit: 'USD/oz',
  },
  {
    name: 'Copper',
    active: true,
    highlight: false,
    icon: 'bolt.fill',
    key: 'copper',
    sortOrder: 6,
    symbol: 'HG=F',
    unit: 'USD/lb',
  },
]

/**
 * Adds the starting materials when the CMS starts with no materials and no prices at all, i.e. the
 * first time. Once there are any, it never adds them again: deleted ones stay deleted.
 */
export const seedMarketMaterials = async (payload: Payload) => {
  const { connection } = payload.db as unknown as MongooseAdapter

  // Not connected, e.g. while building: nothing to do
  if (connection?.readyState !== 1) {
    return
  }

  try {
    const [materials, prices] = await Promise.all([
      payload.count({ collection: 'market-materials', overrideAccess: true }),
      payload.count({ collection: 'market-prices', overrideAccess: true }),
    ])

    if (materials.totalDocs > 0 || prices.totalDocs > 0) {
      return
    }

    for (const data of STARTING_MATERIALS) {
      await payload.create({ collection: 'market-materials', data, overrideAccess: true })
    }
    payload.logger.info(
      `Added the ${STARTING_MATERIALS.length} market materials of the VgemsAI app's Research tab`,
    )
  } catch (err) {
    payload.logger.error({ err, msg: 'Could not add the market materials' })
  }
}
