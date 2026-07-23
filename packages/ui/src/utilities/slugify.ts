import type { Slugify } from 'payload/shared'

import {
  executeAccess,
  getFieldByPath,
  getSlugFallbackValue,
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
  const { collectionSlug, data, globalSlug, locale, path, req, valueToSlugify } = args

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

  if (result) {
    return result
  }

  // No source to slugify: return the collection's `<singular>-N` fallback so the generate button
  // can set it, mirroring the server-side create fallback. Globals have no counter fallback.
  const collectionConfig = collectionSlug ? req.payload.collections[collectionSlug]?.config : null

  // Fall back to the collection's `<singular>-N` counter when there's no source. This probes slug
  // availability across the whole collection with the raw db, so it runs only for the slug field at
  // this path and only when the user has unrestricted read access — a row-filtered (`Where`) result
  // is treated as not allowed, since scoping the probe to readable rows would break uniqueness.
  if (collectionConfig && field && field.type === 'slug' && 'name' in field) {
    const canRead = await executeAccess({ disableErrors: true, req }, collectionConfig.access.read)

    if (canRead === true) {
      return getSlugFallbackValue({
        collection: collectionConfig,
        field: field.name,
        // A localized slug is unique per-locale, so scope the fallback probe to the current locale —
        // otherwise it dedupes against the default locale and can hand back a colliding value. The
        // client passes the active admin locale; fall back to the request's own locale.
        locale: field.localized ? (locale ?? req.locale ?? undefined) : undefined,
        req,
        slugify,
      })
    }
  }

  return result
}
