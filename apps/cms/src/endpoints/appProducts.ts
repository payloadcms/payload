import type { Endpoint, PayloadRequest } from 'payload'

import type { Media, VigorProduct } from '../payload-types'

import { refuseWithoutAppApiKey } from './appApiKey'

/** Prices are in US dollars (VigorProducts' "Price (USD)") */
const CURRENCY = 'USD'
const DEFAULT_LOCALE = 'en'

/**
 * `GET /api/app/products?locale=en` - the Vigor website's catalog for the VgemsAI app's backend
 * (awoz-api), which searches, filters and sorts it for the app: every product the website shows
 * (published and not hidden), in the catalog's order (Sort order), in the language asked for
 * (`en`, `es`, `fr` or `zh-Hant`; English where a text isn't translated).
 *
 * Unlike the website, it includes each product's price: awoz-api passes it on to signed-in app users
 * only. Server to server only, with `X-API-Key: <APP_API_KEY>` (see ./appApiKey.ts); while
 * APP_API_KEY is empty it answers 404.
 *
 *   { locale: "en", currency: "USD",
 *     products: [{ id, slug, sku, name, category, badge, stones: [], sizes: [], metal, weight,
 *                  moq, unit, summary, body, price: 120.5 | null, sortOrder, createdAt, updatedAt,
 *                  image: { url, width, height, alt,
 *                           variants: { max640, max720, max1440: { url, width, height } } } | null }] }
 *
 * Image URLs are absolute: the files are on S3, or on this server.
 */
export const appProductsEndpoint: Endpoint = {
  handler: async (req) => {
    const refused = refuseWithoutAppApiKey(req)

    if (refused) {
      return refused
    }

    const locales = (req.payload.config.localization || undefined)?.localeCodes ?? [DEFAULT_LOCALE]
    const asked = typeof req.query?.locale === 'string' ? req.query.locale : DEFAULT_LOCALE

    if (!locales.includes(asked)) {
      return Response.json(
        { errors: [{ message: `locale must be one of: ${locales.join(', ')}.`, path: 'locale' }] },
        { status: 400 },
      )
    }

    const { docs } = await req.payload.find({
      collection: 'vigor-products',
      // The photo, with its URLs
      depth: 1,
      fallbackLocale: DEFAULT_LOCALE,
      locale: asked as NonNullable<Parameters<typeof req.payload.find>[0]['locale']>,
      // The price is for editors only (field access); this endpoint's API key check stands in
      overrideAccess: true,
      pagination: false,
      sort: 'sortOrder',
      // As the website sees them
      where: {
        and: [{ _status: { equals: 'published' } }, { hidden: { not_equals: true } }],
      },
    })

    return Response.json({
      currency: CURRENCY,
      locale: asked,
      products: docs.map((product) => toAppProduct(req, product)),
    })
  },
  method: 'get',
  path: '/app/products',
}

/** Copies only what the app shows, so an editor-only field added later never leaks by accident */
const toAppProduct = (req: PayloadRequest, product: VigorProduct) => ({
  id: product.id,
  name: product.name,
  badge: product.badge ?? null,
  body: product.body ?? null,
  category: product.category,
  createdAt: product.createdAt,
  image: toAppImage(req, product.image),
  metal: product.metal,
  moq: product.moq,
  price: typeof product.price === 'number' ? product.price : null,
  sizes: product.sizes ?? [],
  sku: product.sku,
  slug: product.slug,
  sortOrder: product.sortOrder ?? null,
  stones: product.stones ?? [],
  summary: product.summary,
  unit: product.unit,
  updatedAt: product.updatedAt,
  weight: product.weight ?? null,
})

const toAppImage = (req: PayloadRequest, image: VigorProduct['image']) => {
  if (!image || typeof image !== 'object' || !image.url) {
    return null
  }

  const media = image as Media
  const variants = Object.fromEntries(
    Object.entries(media.variants ?? {})
      .filter(([, variant]) => variant?.url)
      .map(([name, variant]) => [
        name,
        {
          height: variant?.height ?? null,
          url: absolute(req, variant!.url!),
          width: variant?.width ?? null,
        },
      ]),
  )

  return {
    alt: media.alt,
    height: media.height ?? null,
    url: absolute(req, media.url!),
    variants,
    width: media.width ?? null,
  }
}

/** Files on this server come with a path only: the app needs the whole address */
const absolute = (req: PayloadRequest, url: string) =>
  /^https?:\/\//.test(url) ? url : `${req.payload.config.serverURL ?? ''}${url}`
