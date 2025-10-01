import type { FieldHook } from 'payload'

export const formatSlug = (val: string): string | undefined =>
  val
    ?.replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()

/**
 * This is a `BeforeValidate` field hook.
 * It will auto-generate the slug from a specific fallback field, if necessary.
 * For example, slugifying the title field "My First Post" to "my-first-post".
 *
 * We need to ensure the slug continues to auto-generate through the autosave's initial create.
 * This will ensure the user can continue to edit the fallback field without the slug being prematurely generated.
 * For example, after creating a new autosave post, then editing the title, we want the slug to continue to update.
 *
 * So we only autogenerate the slug if:
 * 1. Autosave is not enabled and we're creating a new doc or there is no slug yet
 * 2. Autosave is enabled and we're publishing a doc, where we now have 3 versions:
 *   - The initial create
 *   - The draft used for autosaves
 *   - The published version
 */
export const formatSlugHook =
  (fallback: string): FieldHook =>
  (args) => {
    const { data, operation, value, collection, global } = args

    if (typeof value === 'string') {
      return formatSlug(value)
    }

    const autosaveEnabled = Boolean(
      (typeof collection?.versions?.drafts === 'object' && collection?.versions?.drafts.autosave) ||
        (typeof global?.versions?.drafts === 'object' && global?.versions?.drafts.autosave),
    )

    let autoGenerateSlug = false

    if (!autosaveEnabled && (operation === 'create' || data?.slug === undefined)) {
      autoGenerateSlug = true
    } else if (autosaveEnabled && operation === 'update') {
      if (data?._status === 'published') {
        autoGenerateSlug = true
      }
    }

    if (autoGenerateSlug) {
      const fallbackData = data?.[fallback]

      if (typeof fallbackData === 'string') {
        return formatSlug(fallbackData)
      }
    }

    return value
  }
