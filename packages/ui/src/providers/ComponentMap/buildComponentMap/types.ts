import type { HiddenInputFieldProps } from '@payloadcms/ui/fields/HiddenInput'
import type { FieldTypes } from 'payload/config'
import type {
  BlockField,
  CellComponentProps,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TabsField,
} from 'payload/types'

import type { ArrayFieldProps } from '../../../fields/Array/index.js'
import type { BlocksFieldProps } from '../../../fields/Blocks/index.js'
import type { CheckboxFieldProps } from '../../../fields/Checkbox/types.js'
import type { CodeFieldProps } from '../../../fields/Code/index.js'
import type { CollapsibleFieldProps } from '../../../fields/Collapsible/index.js'
import type { DateFieldProps } from '../../../fields/DateTime/index.js'
import type { EmailFieldProps } from '../../../fields/Email/index.js'
import type { GroupFieldProps } from '../../../fields/Group/index.js'
import type { JSONFieldProps } from '../../../fields/JSON/index.js'
import type { NumberFieldProps } from '../../../fields/Number/index.js'
import type { PointFieldProps } from '../../../fields/Point/index.js'
import type { RelationshipFieldProps } from '../../../fields/Relationship/index.js'
import type { RichTextFieldProps } from '../../../fields/RichText/index.js'
import type { RowFieldProps } from '../../../fields/Row/types.js'
import type { SelectFieldProps } from '../../../fields/Select/index.js'
import type { TabsFieldProps } from '../../../fields/Tabs/index.js'
import type { TextFieldProps } from '../../../fields/Text/types.js'
import type { TextareaFieldProps } from '../../../fields/Textarea/types.js'
import type { UploadFieldProps } from '../../../fields/Upload/types.js'

export type MappedTab = {
  fieldMap?: FieldMap
  label: TabsField['tabs'][0]['label']
  name?: string
}

export type ReducedBlock = {
  fieldMap: FieldMap
  imageAltText?: string
  imageURL?: string
  labels: BlockField['labels']
  slug: string
}

export type FieldComponentProps =
  | ArrayFieldProps
  | BlocksFieldProps
  | CheckboxFieldProps
  | CodeFieldProps
  | CollapsibleFieldProps
  | DateFieldProps
  | EmailFieldProps
  | GroupFieldProps
  | HiddenInputFieldProps
  | JSONFieldProps
  | NumberFieldProps
  | PointFieldProps
  | RelationshipFieldProps
  | RichTextFieldProps
  | RowFieldProps
  | SelectFieldProps
  | TabsFieldProps
  | TextFieldProps
  | TextareaFieldProps
  | UploadFieldProps

export type MappedField = {
  CustomCell?: React.ReactNode
  CustomField?: React.ReactNode
  cellComponentProps: CellComponentProps
  disableBulkEdit?: boolean
  disabled?: boolean
  fieldComponentProps: FieldComponentProps
  fieldIsPresentational: boolean
  isFieldAffectingData: boolean
  isHidden?: boolean
  isSidebar?: boolean
  localized: boolean
  name?: string
  type: keyof FieldTypes
  unique?: boolean
}

export type FieldMap = MappedField[]

export type ActionMap = {
  Edit: {
    [view: string]: React.ReactNode[]
  }
  List: React.ReactNode[]
}

export type CollectionComponentMap = ConfigComponentMapBase & {
  AfterList: React.ReactNode
  AfterListTable: React.ReactNode
  BeforeList: React.ReactNode
  BeforeListTable: React.ReactNode
  List: React.ReactNode
}

export type GlobalComponentMap = ConfigComponentMapBase

export type ConfigComponentMapBase = {
  Edit: React.ReactNode
  PreviewButton: React.ReactNode
  PublishButton: React.ReactNode
  SaveButton: React.ReactNode
  SaveDraftButton: React.ReactNode
  actionsMap: ActionMap
  fieldMap: FieldMap
  isPreviewEnabled: boolean
}

export type ComponentMap = {
  Icon: React.ReactNode
  LogoutButton: React.ReactNode
  actions: React.ReactNode[]
  collections: {
    [slug: SanitizedCollectionConfig['slug']]: CollectionComponentMap
  }
  globals: {
    [slug: SanitizedGlobalConfig['slug']]: GlobalComponentMap
  }
}
