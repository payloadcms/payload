import type { ClientFieldConfig, FieldPermissions, Operation } from 'payload'

export type Props = {
  className?: string
  fields: ClientFieldConfig[]
  /**
   * Controls the rendering behavior of the fields, i.e. defers rendering until they intersect with the viewport using the Intersection Observer API.
   *
   * If true, the fields will be rendered immediately, rather than waiting for them to intersect with the viewport.
   *
   * If a number is provided, will immediately render fields _up to that index_.
   */
  forceRender?: boolean | number
  indexPath?: string
  margins?: 'small' | false
  operation?: Operation
  path: string
  permissions?: {
    [fieldName: string]: FieldPermissions
  }
  readOnly: boolean
  schemaPath: string
}
