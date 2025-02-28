import type { ClientField, SanitizedFieldPermissions } from 'payload'

export type RenderFieldsProps = {
  readonly className?: string
  readonly fields: ClientField[]
  /**
   * Controls the rendering behavior of the fields, i.e. defers rendering until they intersect with the viewport using the Intersection Observer API.
   *
   * If true, the fields will be rendered immediately, rather than waiting for them to intersect with the viewport.
   *
   * If a number is provided, will immediately render fields _up to that index_.
   */
  readonly forceRender?: boolean
  readonly margins?: 'small' | false
  readonly parentIndexPath: string
  readonly parentPath: string
  readonly parentSchemaPath: string
  readonly permissions:
    | {
        [fieldName: string]: SanitizedFieldPermissions
      }
    | SanitizedFieldPermissions
  readonly readOnly?: boolean
}
