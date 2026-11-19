import type { FormState } from 'payload'

import {
  deepCopyObjectSimpleWithoutReactComponents,
  deepMerge,
  getDataFromFormState,
  isPlainObject,
} from 'payload/shared'

/** Applies initialized field values while preserving fields omitted by read access. */
export const mergeNodeFields = <T extends object>({
  currentFields,
  formState,
}: {
  currentFields: T
  formState: FormState
}): T => {
  const state = deepCopyObjectSimpleWithoutReactComponents(formState, { excludeFiles: true })

  // Unflattening retains field values by reference, distinguishing them from group and row containers.
  const fieldValues = new WeakSet<object>()

  for (const field of Object.values(state)) {
    if (Array.isArray(field.rows) && (field.value === 0 || field.value === null)) {
      field.disableFormData = false
    }

    if (!field.disableFormData && field.value !== null && typeof field.value === 'object') {
      fieldValues.add(field.value)
    }
  }

  const newFields = getDataFromFormState(state, true) as Partial<T>

  return deepMerge<T>(currentFields, newFields, {
    arrayMerge: (target, source, options) =>
      source.map((value: unknown, index) => {
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
          return value
        }

        const row = value as Record<string, unknown>
        const previousRow =
          row.id == null
            ? target[index]
            : target.find(
                (candidate) => candidate?.id === row.id && candidate?.blockType === row.blockType,
              )

        return deepMerge(previousRow ?? {}, row, options)
      }),
    isMergeableObject: (value) => isPlainObject(value) && !fieldValues.has(value),
  })
}
