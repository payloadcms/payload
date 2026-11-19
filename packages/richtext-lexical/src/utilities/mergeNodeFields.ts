import { deepMerge } from 'payload/shared'

/** Preserves fields omitted by read access when applying server-initialized node fields. */
export const mergeNodeFields = <T extends object>({
  currentFields,
  newFields,
}: {
  currentFields: T
  newFields: Partial<T>
}): T =>
  deepMerge<T>(currentFields, newFields, {
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
  })
