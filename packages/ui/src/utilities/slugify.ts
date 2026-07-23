import type { Slugify } from 'payload/shared'

import {
  executeAccess,
  getFieldByPath,
  getSlugFallbackValue,
  getUniqueSlugValue,
  type ServerFunction,
  type SlugifyServerFunctionArgs,
  UnauthorizedError,
} from 'payload'
import { slugify as defaultSlugify } from 'payload/shared'

/**
 * This server function is directly related to the {@link https://payloadcms.com/docs/fields/slug | Slug Field}.
 * This is a server function that is used to invoke the user's custom slugify function from the client.
 * This pattern is required, as there is no other way for us to pass their function across the client-server boundary.
 *   - Not through props
 *   - Not from a server function defined within a server component (see below)
 * When a server function contains non-serializable data within its closure, it gets passed through the boundary (and breaks).
 * The only way to pass server functions to the client (that contain non-serializable data) is if it is globally defined.
 * But we also cannot define this function alongside the server component, as we will not have access to their custom slugify function.
 * See `ServerFunctionsProvider` for more details.
 */
export const slugifyHandler: ServerFunction<
  SlugifyServerFunctionArgs,
  Promise<ReturnType<Slugify>>
> = async (args) => {
  const { id, collectionSlug, data, globalSlug, locale, path, req, valueToSlugify } = args

  if (!req.user) {
    throw new UnauthorizedError()
  }

  const docConfig = collectionSlug
    ? req.payload.collections[collectionSlug]?.config
    : globalSlug
      ? req.payload.config.globals.find((g) => g.slug === globalSlug)
      : null

  if (!docConfig) {
    throw new Error()
  }

  const { field } = getFieldByPath({
    config: req.payload.config,
    fields: docConfig.flattenedFields,
    path,
  })

  const customSlugify = (
    typeof field?.custom?.slugify === 'function' ? field.custom.slugify : undefined
  ) as Slugify

  const slugify = (valueToSlugify: unknown) =>
    customSlugify
      ? customSlugify({ data, req, valueToSlugify })
      : defaultSlugify(valueToSlugify as string)

  const result = await slugify(valueToSlugify)

  const collectionConfig = collectionSlug ? req.payload.collections[collectionSlug]?.config : null

  // Uniqueness dedupe only applies to a collection's slug field. Globals have no collection to
  // dedupe against, so their result is returned as-is.
  if (!collectionConfig || !field || field.type !== 'slug' || !('name' in field)) {
    return result
  }

  // Probing reads across the whole collection with the raw db, so require unrestricted read access —
  // a row-filtered (`Where`) result is treated as not allowed, since scoping the probe to readable
  // rows would break uniqueness.
  const canRead = await executeAccess({ disableErrors: true, req }, collectionConfig.access.read)

  if (canRead !== true) {
    return result
  }

  // A localized slug is unique per-locale, so scope the probe to the current locale — otherwise it
  // dedupes against the default locale and can hand back a colliding value. The client passes the
  // active admin locale; fall back to the request's own locale.
  const localeToScope = field.localized ? (locale ?? req.locale ?? undefined) : undefined

  // The current doc is excluded so a regenerate can reuse its own value rather than bump past it.
  const excludeId = typeof id === 'string' || typeof id === 'number' ? id : undefined

  // A source resolved to a value: dedupe it the same way the next save would, so the generate button
  // can't hand back a slug that's already taken. With no source, return the `<singular>-N` fallback.
  if (result) {
    return getUniqueSlugValue({
      id: excludeId,
      collection: collectionConfig,
      field: field.name,
      locale: localeToScope,
      req,
      value: result,
    })
  }

  return getSlugFallbackValue({
    id: excludeId,
    collection: collectionConfig,
    field: field.name,
    locale: localeToScope,
    req,
    slugify,
  })
}
