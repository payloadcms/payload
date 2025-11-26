import {
  flattenAllFields,
  getFieldByPath,
  type ServerFunction,
  type SlugifyServerFunctionArgs,
  UnauthorizedError,
} from 'payload'
import { slugify as defaultSlugify, type Slugify } from 'payload/shared'

/**
 * This is a server function that is used to invoke the user's custom slugify function from the client.
 * It is required as there is no other way for us to pass this function across the client-server boundary.
 * Not through props, or even a locally defined server function within a server component.
 * It _must_ be defined entirely outside of the component tree, which also means we lose access to the custom function.
 * Fortunately, a globally scoped server function has access to the full Payload config, but _only_ within `@payloadcms/next`.
 * See `ServerFunctionsProvider` for more details.
 */
export const slugifyHandler: ServerFunction<
  SlugifyServerFunctionArgs,
  Promise<ReturnType<Slugify>>
> = async (args) => {
  const { collectionSlug, globalSlug, path, req, val } = args

  const docConfig = collectionSlug
    ? req.payload.collections[collectionSlug]?.config
    : globalSlug
      ? req.payload.config.globals.find((g) => g.slug === globalSlug)
      : null

  if (!req.user) {
    throw new UnauthorizedError()
  }

  const { field } = getFieldByPath({
    config: req.payload.config,
    fields: flattenAllFields({ fields: docConfig?.fields || [] }),
    path: path || '',
  })

  const CustomField = field.admin?.components?.Field

  // This is required for type safety, rip
  const customSlugify =
    typeof CustomField === 'object' &&
    'serverProps' in CustomField &&
    'slugify' in CustomField.serverProps
      ? (CustomField.serverProps.slugify as Slugify)
      : undefined

  const slugify = customSlugify || defaultSlugify

  const result = await slugify(val)

  return result
}
