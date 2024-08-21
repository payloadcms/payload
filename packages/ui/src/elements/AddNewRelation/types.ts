import type { Value } from '../../fields/Relationship/types.js'

export type Props = {
  readonly hasMany: boolean
  readonly path: string
  readonly relationTo: string | string[]
  readonly setValue: (value: unknown) => void
  readonly value: Value | Value[]
}
