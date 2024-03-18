import type {
  BlockField,
  FieldBase,
  Labels,
  Option,
  RelationshipField,
  RichTextField,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TabsField,
} from 'payload/types'

import type { ArrayFieldProps } from '../../forms/fields/Array/types.js'
import type { BlocksFieldProps } from '../../forms/fields/Blocks/types.js'
import type { CheckboxFieldProps } from '../../forms/fields/Checkbox/types.js'
import type { CodeFieldProps } from '../../forms/fields/Code/types.js'
import type { CollapsibleFieldProps } from '../../forms/fields/Collapsible/types.js'
import type { DateFieldProps } from '../../forms/fields/DateTime/types.js'
import type { EmailFieldProps } from '../../forms/fields/Email/types.js'
import type { GroupFieldProps } from '../../forms/fields/Group/types.js'
import type { JSONFieldProps } from '../../forms/fields/JSON/types.js'
import type { NumberFieldProps } from '../../forms/fields/Number/types.js'
import type { PointFieldProps } from '../../forms/fields/Point/types.js'
import type { RelationshipFieldProps } from '../../forms/fields/Relationship/types.js'
import type { RowFieldProps } from '../../forms/fields/Row/types.js'
import type { SelectFieldProps } from '../../forms/fields/Select/types.js'
import type { TabsFieldProps } from '../../forms/fields/Tabs/types.js'
import type { TextFieldProps } from '../../forms/fields/Text/types.js'
import type { TextareaFieldProps } from '../../forms/fields/Textarea/types.js'
import type { UploadFieldProps } from '../../forms/fields/Upload/types.js'
import { FieldTypes } from 'payload/config.js'

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
  | JSONFieldProps
  | NumberFieldProps
  | PointFieldProps
  | RelationshipFieldProps
  | RowFieldProps
  | SelectFieldProps
  | TabsFieldProps
  | TextFieldProps
  | TextareaFieldProps
  | UploadFieldProps

export type MappedFieldBase = {
  Cell: React.ReactNode
  CustomField?: React.ReactNode
  Heading: React.ReactNode
  disabled?: boolean
  fieldIsPresentational: boolean
  isFieldAffectingData: boolean
  isSidebar?: boolean
  localized: boolean
  type: keyof FieldTypes
  fieldComponentProps: FieldComponentProps
}

export type MappedField = MappedFieldBase

export type FieldMap = MappedField[]

export type ActionMap = {
  Edit: {
    [view: string]: React.ReactNode[]
  }
  List: React.ReactNode[]
}

export type CollectionComponentMap = ConfigComponentMapBase & {
  AdminThumbnail: React.ReactNode
  AfterList: React.ReactNode
  AfterListTable: React.ReactNode
  BeforeList: React.ReactNode
  BeforeListTable: React.ReactNode
  List: React.ReactNode
}

export type GlobalComponentMap = ConfigComponentMapBase

export type ConfigComponentMapBase = {
  Edit: React.ReactNode
  actionsMap: ActionMap
  fieldMap: FieldMap
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
