import type { ClientField, SanitizedFieldPermissions } from 'payload'
import type React from 'react'
import type { DiffMethod } from 'react-diff-viewer-continued'

import type { VersionField } from '../../buildVersionState.js'

export type DiffComponents = Record<string, React.FC<DiffComponentProps>>

export type DiffComponentProps<TField extends ClientField = ClientField> = {
  readonly comparison: any
  readonly diffComponents: DiffComponents
  readonly diffMethod?: DiffMethod
  readonly field: TField
  readonly fieldPermissions?:
    | {
        [key: string]: SanitizedFieldPermissions
      }
    | true
  readonly fields: ClientField[]
  readonly isRichText?: boolean
  readonly locale?: string
  readonly locales?: string[]
  readonly version: any
  versionField: VersionField
}
