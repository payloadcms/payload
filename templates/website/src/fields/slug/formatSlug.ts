import type { FieldHook } from 'payload'
import { countVersions } from './countVersions'

export const formatSlug = (val: string): string | undefined =>
  val
    ?.replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()

/**
 * This is a `BeforeValidate` field hook.
 * It will auto-generate the slug from a specific fallback field, if necessary.
 * For example, generating a slug from the title field: "My First Post" to "my-first-post".
 *
 * For autosave, We need to ensure the slug continues to auto-generate through the initial create.
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
  async (args) => {
    const { data, operation, value, collection, global } = args

    let toReturn = value

    // during create, only generate the slug if the user has not provided one
    if (data?.generateSlug && (operation === 'update' || (operation === 'create' && !value))) {
      toReturn = data?.[fallback]
    }

    const autosaveEnabled = Boolean(
      (typeof collection?.versions?.drafts === 'object' && collection?.versions?.drafts.autosave) ||
        (typeof global?.versions?.drafts === 'object' && global?.versions?.drafts.autosave),
    )

    // Important: ensure `countVersions` is not called unnecessarily often
    // To do this, early return if `generateSlug` is already false
    const shouldContinueGenerating = Boolean(
      data?.generateSlug &&
        operation === 'update' &&
        (!autosaveEnabled || (await countVersions(args)) < 3),
    )

    if (!shouldContinueGenerating) {
      if (data) {
        data.generateSlug = false
      }
    }

    return formatSlug(toReturn)
  }
