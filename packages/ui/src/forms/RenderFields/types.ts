import type { ClientField, FieldPermissions, Operation } from 'payload'

export type Props = {
  readonly className?: string
  readonly fields: ClientField[]
  /**
   * Controls the rendering behavior of the fields, i.e. defers rendering until they intersect with the viewport using the Intersection Observer API.
   *
   * If true, the fields will be rendered immediately, rather than waiting for them to intersect with the viewport.
   *
   * If a number is provided, will immediately render fields _up to that index_.
   */
  readonly forceRender?: boolean | number
  readonly indexPath?: string
  readonly margins?: 'small' | false
  readonly operation?: Operation
  readonly path: string
  readonly permissions?: {
    [fieldName: string]: FieldPermissions
  }
  readonly readOnly: boolean
  readonly schemaPath: string
}
