export const slugFieldAsyncSlug = 'slug-fields-async'
export const slugFieldAsyncAutosaveSlug = 'slug-fields-async-autosave'

/**
 * An intentionally asynchronous `slugify`. The `await` is what makes this a regression test:
 * the returned promise is unresolved when the hook assigns it, so a missing `await` at the
 * assignment site stores the promise itself rather than the string.
 */
export const asyncSlugify = async ({ valueToSlugify }: { valueToSlugify?: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 0))

  return valueToSlugify ? `async-${valueToSlugify.toLowerCase().replace(/ /g, '-')}` : undefined
}
