/**
 * Form keys the server assigns rather than the editor. The paths that have no saved document hand
 * their request body to the collection-level hooks as `exportDoc`/`importDoc`, where an `id`
 * means "this document is saved". Dropping these keys on both sides of the request keeps that
 * rule true even when a caller puts them on the body by hand.
 */
const serverOwnedFormKeys = new Set(['createdAt', 'id', 'updatedAt'])

/**
 * Returns the editor-authored values of an import/export form.
 *
 * The preview components use this to decide what to send: they used to build their request
 * body from a fixed list of built-in fields, so a field a project added with
 * `overrideCollection` never reached the hooks. The endpoints use it on the way back in, so a
 * client cannot claim a document is saved when it is not.
 */
export const getSubmittedFormValues = ({
  formData,
  omit = [],
}: {
  formData: Record<string, unknown>
  omit?: string[]
}): Record<string, unknown> => {
  const omitKeys = new Set([...omit, ...serverOwnedFormKeys])

  return Object.fromEntries(Object.entries(formData).filter(([key]) => !omitKeys.has(key)))
}

/**
 * A value-based signature of the form, for a preview effect's dependency array. Serializing
 * the values rather than passing the state object keeps the effect from re-running on every
 * unrelated form render, while still re-running when a custom field changes.
 *
 * Takes the flat field state, so a nested custom field contributes through its dotted path.
 */
export const getFormStateSignature = ({
  fields,
  omit = [],
}: {
  fields: Record<string, { value?: unknown } | undefined>
  omit?: string[]
}): string => {
  const omitKeys = new Set([...omit, ...serverOwnedFormKeys])

  return JSON.stringify(
    Object.entries(fields)
      .filter(([path]) => !omitKeys.has(path))
      .map(([path, field]) => [path, field?.value]),
  )
}
