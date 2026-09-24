/** Unsaved form values must not appear to come from a saved document. */
const serverOwnedFormKeys = new Set(['createdAt', 'id', 'updatedAt'])

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

/** Tracks value changes, including nested custom fields, without depending on field state identity. */
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
