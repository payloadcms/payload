import { flattenAllFields, getFieldByPath, UnauthorizedError } from 'payload';
import { slugify as defaultSlugify } from 'payload/shared';
/**
 * This server function is directly related to the {@link https://payloadcms.com/docs/fields/text#slug-field | Slug Field}.
 * This is a server function that is used to invoke the user's custom slugify function from the client.
 * This pattern is required, as there is no other way for us to pass their function across the client-server boundary.
 *   - Not through props
 *   - Not from a server function defined within a server component (see below)
 * When a server function contains non-serializable data within its closure, it gets passed through the boundary (and breaks).
 * The only way to pass server functions to the client (that contain non-serializable data) is if it is globally defined.
 * But we also cannot define this function alongside the server component, as we will not have access to their custom slugify function.
 * See `ServerFunctionsProvider` for more details.
 */
export const slugifyHandler = async args => {
  const {
    collectionSlug,
    data,
    globalSlug,
    path,
    req,
    valueToSlugify
  } = args;
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const docConfig = collectionSlug ? req.payload.collections[collectionSlug]?.config : globalSlug ? req.payload.config.globals.find(g => g.slug === globalSlug) : null;
  if (!docConfig) {
    throw new Error();
  }
  const {
    field
  } = getFieldByPath({
    config: req.payload.config,
    fields: flattenAllFields({
      fields: docConfig.fields
    }),
    path
  });
  const customSlugify = typeof field?.custom?.slugify === 'function' ? field.custom.slugify : undefined;
  const result = customSlugify ? await customSlugify({
    data,
    req,
    valueToSlugify
  }) : defaultSlugify(valueToSlugify);
  return result;
};
//# sourceMappingURL=slugify.js.map