import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Payload } from 'payload'

import type { MarketMaterial } from '../payload-types'

type NewMaterial = Pick<
  MarketMaterial,
  'active' | 'highlight' | 'icon' | 'key' | 'name' | 'sortOrder' | 'symbol' | 'unit'
>

/**
 * What the VgemsAI app's Research tab started with, under its keys, with their names in API Ninjas'
 * Commodity Price API (futures, which follow the spot price closely): gold, silver, platinum and
 * palladium per troy ounce, copper per pound and Brent crude per barrel, in US dollars.
 */
const STARTING_MATERIALS: NewMaterial[] = [
  {
    name: 'Gold',
    active: true,
    highlight: true,
    icon: 'circle.hexagongrid.fill',
    key: 'gold',
    sortOrder: 1,
    symbol: 'gold',
    unit: 'USD/oz',
  },
  {
    name: 'Silver',
    active: true,
    highlight: true,
    icon: 'circle.hexagongrid',
    key: 'silver',
    sortOrder: 2,
    symbol: 'silver',
    unit: 'USD/oz',
  },
  {
    name: 'Crude Oil (Brent)',
    active: true,
    highlight: true,
    icon: 'drop.fill',
    key: 'oil',
    sortOrder: 3,
    symbol: 'brent_crude_oil',
    unit: 'USD/bbl',
  },
  {
    name: 'Platinum',
    active: true,
    highlight: false,
    icon: 'seal.fill',
    key: 'platinum',
    sortOrder: 4,
    symbol: 'platinum',
    unit: 'USD/oz',
  },
  {
    name: 'Palladium',
    active: true,
    highlight: false,
    icon: 'seal',
    key: 'palladium',
    sortOrder: 5,
    symbol: 'palladium',
    unit: 'USD/oz',
  },
  {
    name: 'Copper',
    active: true,
    highlight: false,
    icon: 'bolt.fill',
    key: 'copper',
    sortOrder: 6,
    symbol: 'copper',
    unit: 'USD/lb',
  },
]

/** The Yahoo Finance symbols awoz-api's first version used, and the same commodity in API Ninjas */
const API_NINJAS_NAMES: Record<string, string> = {
  'BZ=F': 'brent_crude_oil',
  'GC=F': 'gold',
  'HG=F': 'copper',
  'PA=F': 'palladium',
  'PL=F': 'platinum',
  'SI=F': 'silver',
}

/**
 * Adds the starting materials when the CMS starts with no materials and no prices at all, i.e. the
 * first time. Once there are any, it never adds them again: deleted ones stay deleted. Materials still
 * named by their Yahoo Finance symbol get their API Ninjas name.
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
      await renameYahooSymbols(payload)
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

const renameYahooSymbols = async (payload: Payload) => {
  const { docs } = await payload.find({
    collection: 'market-materials',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { symbol: true },
    where: { symbol: { in: Object.keys(API_NINJAS_NAMES) } },
  })

  for (const material of docs) {
    await payload.update({
      id: material.id,
      collection: 'market-materials',
      data: { symbol: API_NINJAS_NAMES[material.symbol ?? ''] },
      overrideAccess: true,
    })
  }
  if (docs.length > 0) {
    payload.logger.info(`Gave ${docs.length} market materials their API Ninjas names`)
  }
}
