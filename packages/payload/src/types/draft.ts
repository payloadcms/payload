import type { Builtin, IsAny } from 'ts-essentials'

/**
 * Draft field data can be incomplete at any depth. Preserve document IDs and the
 * discriminators used to identify blocks and polymorphic relationships.
 * Serialized rich text retains its editor-defined structure when present.
 */
export type DraftFieldData<TData> =
  IsAny<TData> extends true
    ? TData
    : TData extends Builtin
      ? TData
      : TData extends { root: { children: unknown[]; type: string } }
        ? TData
        : TData extends readonly unknown[]
          ? { [TKey in keyof TData]: DraftFieldData<TData[TKey]> }
          : TData extends object
            ? {
                [TKey in keyof TData as TKey extends 'blockType' | 'id' | 'relationTo'
                  ? never
                  : TKey]?: DraftFieldData<TData[TKey]>
              } & {
                [TKey in keyof TData as TKey extends 'blockType' | 'id' | 'relationTo'
                  ? TKey
                  : never]: TData[TKey]
              }
            : TData
