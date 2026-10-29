import type { Endpoint } from 'payload'

import type { MarketMaterial, MarketPrice } from '../payload-types'

import { refuseWithoutAppApiKey } from './appApiKey'

/**
 * Raw material prices for the VgemsAI app's Research tab, from Market Materials and Market Prices (under
 * "VgemsAI App"). awoz-api reads them for the app, and saves each material's price every 4 hours (one per
 * day: the day's last). Server to server only, with `X-API-Key: <APP_API_KEY>` (see ./appApiKey.ts); while
 * APP_API_KEY is empty both endpoints answer 404.
 *
 * Days are written `YYYY-MM-DD`. They're stored at 12:00 UTC on the day, as the admin panel's date picker
 * saves them.
 */

/** How far back the monthly prices go */
const HISTORY_MONTHS = 120
/** How far back the weekly prices go */
const WEEKLY_DAYS = 371
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_PRICES_PER_REQUEST = 1000
/** Where awoz-api's prices may come from; "manual" is for the admin panel only */
const SOURCES = ['api-ninjas'] as const

type Day = { date: string; price: number }

/**
 * `GET /api/app/market` - the active materials, in their order, each with its two latest prices, its
 * price at the end of every month for the last 10 years, and at the end of every week for the last year:
 *
 *   { materials: [{ key, name, unit, icon, symbol, highlight,
 *                   latest: { date, price } | null, previous: { date, price } | null,
 *                   monthly: [{ month: "2026-09", date: "2026-09-30", price }],
 *                   weekly: [{ date: "2026-10-23", price }] }] }
 *
 * `monthly` and `weekly` are oldest first; their last month or week is the current one so far (its price
 * is `latest`). Weeks start on Monday. `symbol` is null for a material whose prices are entered by hand.
 */
export const appMarketEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const { payload } = req
    const { docs: materials } = await payload.find({
      collection: 'market-materials',
      depth: 0,
      // Internal collection: this endpoint's API key check replaces the logged-in check
      overrideAccess: true,
      pagination: false,
      select: { name: true, highlight: true, icon: true, key: true, symbol: true, unit: true },
      sort: 'sortOrder',
      where: { active: { equals: true } },
    })

    const since = new Date()
    since.setUTCDate(1)
    since.setUTCMonth(since.getUTCMonth() - HISTORY_MONTHS)
    since.setUTCHours(0, 0, 0, 0)

    const result = await Promise.all(
      materials.map(async (material) => {
        const { docs } = await payload.find({
          collection: 'market-prices',
          depth: 0,
          overrideAccess: true,
          pagination: false,
          select: { date: true, price: true },
          sort: 'date',
          where: {
            and: [
              { material: { equals: material.id } },
              { date: { greater_than_equal: since.toISOString() } },
            ],
          },
        })

        return toAppMaterial(material, docs.map(toDay))
      }),
    )

    return Response.json({ materials: result })
  },
  method: 'get',
  path: '/app/market',
}

type PricesBody = {
  prices?: unknown
  source?: unknown
}

type NewPrice = { date: string; price: number }

/**
 * `POST /api/app/market-prices` - saves closing prices, e.g. each day's:
 *
 *   { "source": "yahoo", "prices": [{ "material": "gold", "date": "2026-10-28", "price": 2680.5 }] }
 *
 * `material` is the material's key. A day that already has a price gets the new one, unless someone entered
 * or corrected it in the admin panel: that one is kept. At most 1000 prices per request. Answers
 * `{ created, updated, unchanged, kept }`; an unknown material or an invalid price is `400`, and then nothing
 * is saved.
 */
export const appMarketPricesEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const body = (await req.json?.().catch(() => null)) as null | PricesBody
    const source = body?.source

    if (!SOURCES.includes(source as (typeof SOURCES)[number])) {
      return badRequest('source', `source must be one of: ${SOURCES.join(', ')}.`)
    }
    if (
      !Array.isArray(body?.prices) ||
      body.prices.length === 0 ||
      body.prices.length > MAX_PRICES_PER_REQUEST
    ) {
      return badRequest('prices', `prices must be a list of 1 to ${MAX_PRICES_PER_REQUEST} prices.`)
    }

    const { payload } = req
    const { docs: materials } = await payload.find({
      collection: 'market-materials',
      depth: 0,
      overrideAccess: true,
      pagination: false,
      select: { key: true },
    })
    const idByKey = new Map(materials.map((material) => [material.key, material.id]))

    const byMaterial = new Map<string, NewPrice[]>()
    for (const [index, item] of (body.prices as unknown[]).entries()) {
      const { date, material, price } = (item ?? {}) as Record<string, unknown>
      const id = typeof material === 'string' ? idByKey.get(material) : undefined

      if (id === undefined) {
        return badRequest(`prices.${index}.material`, `Unknown material: ${String(material)}.`)
      }
      if (typeof date !== 'string' || !isDay(date)) {
        return badRequest(`prices.${index}.date`, 'date must be a day, e.g. 2026-10-28.')
      }
      if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
        return badRequest(`prices.${index}.price`, 'price must be a number above 0.')
      }
      byMaterial.set(id, [...(byMaterial.get(id) ?? []), { date, price }])
    }

    const counts = { created: 0, kept: 0, unchanged: 0, updated: 0 }

    for (const [material, prices] of byMaterial) {
      const days = prices.map((p) => p.date).sort()
      const { docs } = await payload.find({
        collection: 'market-prices',
        depth: 0,
        overrideAccess: true,
        pagination: false,
        select: { date: true, price: true, source: true },
        where: {
          and: [
            { material: { equals: material } },
            { date: { greater_than_equal: storedDate(days[0]!) } },
            { date: { less_than_equal: storedDate(days[days.length - 1]!) } },
          ],
        },
      })
      const saved = new Map(docs.map((doc) => [doc.date.slice(0, 10), doc]))

      for (const { date, price } of prices) {
        const existing = saved.get(date)

        if (!existing) {
          await payload.create({
            collection: 'market-prices',
            data: {
              date: storedDate(date),
              material,
              price,
              source: source as MarketPrice['source'],
            },
            overrideAccess: true,
          })
          counts.created++
        } else if (existing.source === 'manual') {
          counts.kept++
        } else if (existing.price === price) {
          counts.unchanged++
        } else {
          await payload.update({
            id: existing.id,
            collection: 'market-prices',
            data: { price, source: source as MarketPrice['source'] },
            overrideAccess: true,
          })
          counts.updated++
        }
      }
    }

    return Response.json(counts)
  },
  method: 'post',
  path: '/app/market-prices',
}

const toDay = (doc: Pick<MarketPrice, 'date' | 'price'>): Day => ({
  date: doc.date.slice(0, 10),
  price: doc.price,
})

/** `days` oldest first */
const toAppMaterial = (
  material: Pick<MarketMaterial, 'highlight' | 'icon' | 'key' | 'name' | 'symbol' | 'unit'>,
  days: Day[],
) => {
  // The last price of each month
  const monthly: (Day & { month: string })[] = []
  for (const day of days) {
    const month = day.date.slice(0, 7)
    if (monthly.at(-1)?.month === month) {
      monthly[monthly.length - 1] = { ...day, month }
    } else {
      monthly.push({ ...day, month })
    }
  }

  // The last price of each week, for the last year
  const weeklySince = daysAgo(WEEKLY_DAYS)
  const weekly: (Day & { week: string })[] = []
  for (const day of days.filter(({ date }) => date >= weeklySince)) {
    const week = mondayOf(day.date)
    if (weekly.at(-1)?.week === week) {
      weekly[weekly.length - 1] = { ...day, week }
    } else {
      weekly.push({ ...day, week })
    }
  }

  return {
    name: material.name,
    highlight: material.highlight ?? false,
    icon: material.icon,
    key: material.key,
    latest: days.at(-1) ?? null,
    monthly,
    previous: days.at(-2) ?? null,
    symbol: material.symbol || null,
    unit: material.unit,
    weekly: weekly.map(({ date, price }) => ({ date, price })),
  }
}

/** YYYY-MM-DD of the day `count` days before today, UTC */
const daysAgo = (count: number) => new Date(Date.now() - count * DAY_MS).toISOString().slice(0, 10)

/** YYYY-MM-DD of the Monday of a YYYY-MM-DD day's week */
const mondayOf = (day: string) => {
  const date = new Date(storedDate(day))
  const sinceMonday = (date.getUTCDay() + 6) % 7

  return new Date(date.getTime() - sinceMonday * DAY_MS).toISOString().slice(0, 10)
}

const storedDate = (day: string) => `${day}T12:00:00.000Z`

/** A real day written YYYY-MM-DD, e.g. not 2026-02-30 */
const isDay = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(storedDate(value))) &&
  new Date(storedDate(value)).toISOString() === storedDate(value)

const badRequest = (path: string, message: string) =>
  Response.json({ errors: [{ message, path }] }, { status: 400 })
