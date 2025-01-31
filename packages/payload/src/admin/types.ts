import type { AcceptedLanguages, I18nClient } from '@payloadcms/translations'
import type React from 'react'

import type { ImportMap } from '../bin/generateImportMap/index.js'
import type { SanitizedConfig } from '../config/types.js'
import type {
  Block,
  ClientBlock,
  ClientField,
  Field,
  FieldTypes,
  Tab,
} from '../fields/config/types.js'
import type { JsonObject } from '../types/index.js'
import type { ClientTab } from './fields/Tabs.js'
import type {
  BuildFormStateArgs,
  Data,
  FieldState,
  FieldStateWithoutComponents,
  FilterOptionsResult,
  FormState,
  FormStateWithoutComponents,
  Row,
} from './forms/Form.js'

export type { DefaultCellComponentProps, DefaultServerCellComponentProps } from './elements/Cell.js'
export type { ConditionalDateProps } from './elements/DatePicker.js'
export type { DayPickerProps, SharedProps, TimePickerProps } from './elements/DatePicker.js'
export type { NavGroupPreferences, NavPreferences } from './elements/Nav.js'
export type { CustomPreviewButton } from './elements/PreviewButton.js'
export type { CustomPublishButton } from './elements/PublishButton.js'
export type { CustomSaveButton } from './elements/SaveButton.js'
export type { CustomSaveDraftButton } from './elements/SaveDraftButton.js'
export type {
  DocumentTabComponent,
  DocumentTabCondition,
  DocumentTabConfig,
  DocumentTabProps,
} from './elements/Tab.js'

export type { CustomUpload } from './elements/Upload.js'

export type {
  WithServerSidePropsComponent,
  WithServerSidePropsComponentProps,
} from './elements/WithServerSideProps.js'

export type {
  ArrayFieldClientComponent,
  ArrayFieldClientProps,
  ArrayFieldDescriptionClientComponent,
  ArrayFieldDescriptionServerComponent,
  ArrayFieldDiffClientComponent,
  ArrayFieldDiffServerComponent,
  ArrayFieldErrorClientComponent,
  ArrayFieldErrorServerComponent,
  ArrayFieldLabelClientComponent,
  ArrayFieldLabelServerComponent,
  ArrayFieldServerComponent,
  ArrayFieldServerProps,
} from './fields/Array.js'

export type {
  BlockRowLabelClientComponent,
  BlockRowLabelServerComponent,
  BlocksFieldClientComponent,
  BlocksFieldClientProps,
  BlocksFieldDescriptionClientComponent,
  BlocksFieldDescriptionServerComponent,
  BlocksFieldDiffClientComponent,
  BlocksFieldDiffServerComponent,
  BlocksFieldErrorClientComponent,
  BlocksFieldErrorServerComponent,
  BlocksFieldLabelClientComponent,
  BlocksFieldLabelServerComponent,
  BlocksFieldServerComponent,
  BlocksFieldServerProps,
} from './fields/Blocks.js'

export type {
  CheckboxFieldClientComponent,
  CheckboxFieldClientProps,
  CheckboxFieldDescriptionClientComponent,
  CheckboxFieldDescriptionServerComponent,
  CheckboxFieldDiffClientComponent,
  CheckboxFieldDiffServerComponent,
  CheckboxFieldErrorClientComponent,
  CheckboxFieldErrorServerComponent,
  CheckboxFieldLabelClientComponent,
  CheckboxFieldLabelServerComponent,
  CheckboxFieldServerComponent,
  CheckboxFieldServerProps,
} from './fields/Checkbox.js'

export type {
  CodeFieldClientComponent,
  CodeFieldClientProps,
  CodeFieldDescriptionClientComponent,
  CodeFieldDescriptionServerComponent,
  CodeFieldDiffClientComponent,
  CodeFieldDiffServerComponent,
  CodeFieldErrorClientComponent,
  CodeFieldErrorServerComponent,
  CodeFieldLabelClientComponent,
  CodeFieldLabelServerComponent,
  CodeFieldServerComponent,
  CodeFieldServerProps,
} from './fields/Code.js'

export type {
  CollapsibleFieldClientComponent,
  CollapsibleFieldClientProps,
  CollapsibleFieldDescriptionClientComponent,
  CollapsibleFieldDescriptionServerComponent,
  CollapsibleFieldDiffClientComponent,
  CollapsibleFieldDiffServerComponent,
  CollapsibleFieldErrorClientComponent,
  CollapsibleFieldErrorServerComponent,
  CollapsibleFieldLabelClientComponent,
  CollapsibleFieldLabelServerComponent,
  CollapsibleFieldServerComponent,
  CollapsibleFieldServerProps,
} from './fields/Collapsible.js'

export type {
  DateFieldClientComponent,
  DateFieldClientProps,
  DateFieldDescriptionClientComponent,
  DateFieldDescriptionServerComponent,
  DateFieldDiffClientComponent,
  DateFieldDiffServerComponent,
  DateFieldErrorClientComponent,
  DateFieldErrorServerComponent,
  DateFieldLabelClientComponent,
  DateFieldLabelServerComponent,
  DateFieldServerComponent,
  DateFieldServerProps,
} from './fields/Date.js'

export type {
  EmailFieldClientComponent,
  EmailFieldClientProps,
  EmailFieldDescriptionClientComponent,
  EmailFieldDescriptionServerComponent,
  EmailFieldDiffClientComponent,
  EmailFieldDiffServerComponent,
  EmailFieldErrorClientComponent,
  EmailFieldErrorServerComponent,
  EmailFieldLabelClientComponent,
  EmailFieldLabelServerComponent,
  EmailFieldServerComponent,
  EmailFieldServerProps,
} from './fields/Email.js'

export type {
  GroupFieldClientComponent,
  GroupFieldClientProps,
  GroupFieldDescriptionClientComponent,
  GroupFieldDescriptionServerComponent,
  GroupFieldDiffClientComponent,
  GroupFieldDiffServerComponent,
  GroupFieldErrorClientComponent,
  GroupFieldErrorServerComponent,
  GroupFieldLabelClientComponent,
  GroupFieldLabelServerComponent,
  GroupFieldServerComponent,
  GroupFieldServerProps,
} from './fields/Group.js'

export type { HiddenFieldProps } from './fields/Hidden.js'

export type {
  JoinFieldClientComponent,
  JoinFieldClientProps,
  JoinFieldDescriptionClientComponent,
  JoinFieldDescriptionServerComponent,
  JoinFieldDiffClientComponent,
  JoinFieldDiffServerComponent,
  JoinFieldErrorClientComponent,
  JoinFieldErrorServerComponent,
  JoinFieldLabelClientComponent,
  JoinFieldLabelServerComponent,
  JoinFieldServerComponent,
  JoinFieldServerProps,
} from './fields/Join.js'

export type {
  JSONFieldClientComponent,
  JSONFieldClientProps,
  JSONFieldDescriptionClientComponent,
  JSONFieldDescriptionServerComponent,
  JSONFieldDiffClientComponent,
  JSONFieldDiffServerComponent,
  JSONFieldErrorClientComponent,
  JSONFieldErrorServerComponent,
  JSONFieldLabelClientComponent,
  JSONFieldLabelServerComponent,
  JSONFieldServerComponent,
  JSONFieldServerProps,
} from './fields/JSON.js'

export type {
  NumberFieldClientComponent,
  NumberFieldClientProps,
  NumberFieldDescriptionClientComponent,
  NumberFieldDescriptionServerComponent,
  NumberFieldDiffClientComponent,
  NumberFieldDiffServerComponent,
  NumberFieldErrorClientComponent,
  NumberFieldErrorServerComponent,
  NumberFieldLabelClientComponent,
  NumberFieldLabelServerComponent,
  NumberFieldServerComponent,
  NumberFieldServerProps,
} from './fields/Number.js'

export type {
  PointFieldClientComponent,
  PointFieldClientProps,
  PointFieldDescriptionClientComponent,
  PointFieldDescriptionServerComponent,
  PointFieldDiffClientComponent,
  PointFieldDiffServerComponent,
  PointFieldErrorClientComponent,
  PointFieldErrorServerComponent,
  PointFieldLabelClientComponent,
  PointFieldLabelServerComponent,
  PointFieldServerComponent,
  PointFieldServerProps,
} from './fields/Point.js'

export type {
  RadioFieldClientComponent,
  RadioFieldClientProps,
  RadioFieldDescriptionClientComponent,
  RadioFieldDescriptionServerComponent,
  RadioFieldDiffClientComponent,
  RadioFieldDiffServerComponent,
  RadioFieldErrorClientComponent,
  RadioFieldErrorServerComponent,
  RadioFieldLabelClientComponent,
  RadioFieldLabelServerComponent,
  RadioFieldServerComponent,
  RadioFieldServerProps,
} from './fields/Radio.js'

export type {
  RelationshipFieldClientComponent,
  RelationshipFieldClientProps,
  RelationshipFieldDescriptionClientComponent,
  RelationshipFieldDescriptionServerComponent,
  RelationshipFieldDiffClientComponent,
  RelationshipFieldDiffServerComponent,
  RelationshipFieldErrorClientComponent,
  RelationshipFieldErrorServerComponent,
  RelationshipFieldLabelClientComponent,
  RelationshipFieldLabelServerComponent,
  RelationshipFieldServerComponent,
  RelationshipFieldServerProps,
} from './fields/Relationship.js'

export type {
  RichTextFieldClientComponent,
  RichTextFieldClientProps,
  RichTextFieldDescriptionClientComponent,
  RichTextFieldDescriptionServerComponent,
  RichTextFieldDiffClientComponent,
  RichTextFieldDiffServerComponent,
  RichTextFieldErrorClientComponent,
  RichTextFieldErrorServerComponent,
  RichTextFieldLabelClientComponent,
  RichTextFieldLabelServerComponent,
  RichTextFieldServerComponent,
  RichTextFieldServerProps,
} from './fields/RichText.js'

export type {
  RowFieldClientComponent,
  RowFieldClientProps,
  RowFieldDescriptionClientComponent,
  RowFieldDescriptionServerComponent,
  RowFieldDiffClientComponent,
  RowFieldDiffServerComponent,
  RowFieldErrorClientComponent,
  RowFieldErrorServerComponent,
  RowFieldLabelClientComponent,
  RowFieldLabelServerComponent,
  RowFieldServerComponent,
  RowFieldServerProps,
} from './fields/Row.js'

export type {
  SelectFieldClientComponent,
  SelectFieldClientProps,
  SelectFieldDescriptionClientComponent,
  SelectFieldDescriptionServerComponent,
  SelectFieldDiffClientComponent,
  SelectFieldDiffServerComponent,
  SelectFieldErrorClientComponent,
  SelectFieldErrorServerComponent,
  SelectFieldLabelClientComponent,
  SelectFieldLabelServerComponent,
  SelectFieldServerComponent,
  SelectFieldServerProps,
} from './fields/Select.js'

export type {
  ClientTab,
  TabsFieldClientComponent,
  TabsFieldClientProps,
  TabsFieldDescriptionClientComponent,
  TabsFieldDescriptionServerComponent,
  TabsFieldDiffClientComponent,
  TabsFieldDiffServerComponent,
  TabsFieldErrorClientComponent,
  TabsFieldErrorServerComponent,
  TabsFieldLabelClientComponent,
  TabsFieldLabelServerComponent,
  TabsFieldServerComponent,
  TabsFieldServerProps,
} from './fields/Tabs.js'

export type {
  TextFieldClientComponent,
  TextFieldClientProps,
  TextFieldDescriptionClientComponent,
  TextFieldDescriptionServerComponent,
  TextFieldDiffClientComponent,
  TextFieldDiffServerComponent,
  TextFieldErrorClientComponent,
  TextFieldErrorServerComponent,
  TextFieldLabelClientComponent,
  TextFieldLabelServerComponent,
  TextFieldServerComponent,
  TextFieldServerProps,
} from './fields/Text.js'

export type {
  TextareaFieldClientComponent,
  TextareaFieldClientProps,
  TextareaFieldDescriptionClientComponent,
  TextareaFieldDescriptionServerComponent,
  TextareaFieldDiffClientComponent,
  TextareaFieldDiffServerComponent,
  TextareaFieldErrorClientComponent,
  TextareaFieldErrorServerComponent,
  TextareaFieldLabelClientComponent,
  TextareaFieldLabelServerComponent,
  TextareaFieldServerComponent,
  TextareaFieldServerProps,
} from './fields/Textarea.js'

export type {
  UIFieldClientComponent,
  UIFieldClientProps,
  UIFieldDiffClientComponent,
  UIFieldDiffServerComponent,
  UIFieldServerComponent,
  UIFieldServerProps,
} from './fields/UI.js'

export type {
  UploadFieldClientComponent,
  UploadFieldClientProps,
  UploadFieldDescriptionClientComponent,
  UploadFieldDescriptionServerComponent,
  UploadFieldDiffClientComponent,
  UploadFieldDiffServerComponent,
  UploadFieldErrorClientComponent,
  UploadFieldErrorServerComponent,
  UploadFieldLabelClientComponent,
  UploadFieldLabelServerComponent,
  UploadFieldServerComponent,
  UploadFieldServerProps,
} from './fields/Upload.js'

export type {
  Description,
  DescriptionFunction,
  FieldDescriptionClientComponent,
  FieldDescriptionClientProps,
  FieldDescriptionServerComponent,
  FieldDescriptionServerProps,
  GenericDescriptionProps,
  StaticDescription,
} from './forms/Description.js'

export type {
  BaseVersionField,
  DiffMethod,
  FieldDiffClientComponent,
  FieldDiffClientProps,
  FieldDiffServerComponent,
  FieldDiffServerProps,
  VersionField,
  VersionTab,
} from './forms/Diff.js'

export type {
  FieldErrorClientComponent,
  FieldErrorClientProps,
  FieldErrorServerComponent,
  FieldErrorServerProps,
  GenericErrorProps,
} from './forms/Error.js'

export type {
  BuildFormStateArgs,
  Data,
  FieldState as FormField,
  FieldStateWithoutComponents as FormFieldWithoutComponents,
  FilterOptionsResult,
  FormState,
  FormStateWithoutComponents,
  Row,
}

export type {
  ClientComponentProps,
  ClientFieldBase,
  ClientFieldWithOptionalType,
  FieldClientComponent,
  FieldPaths,
  FieldServerComponent,
  ServerComponentProps,
  ServerFieldBase,
} from './forms/Field.js'

export type {
  FieldLabelClientComponent,
  FieldLabelClientProps,
  FieldLabelServerComponent,
  FieldLabelServerProps,
  GenericLabelProps,
  SanitizedLabelProps,
} from './forms/Label.js'

export type { RowLabel, RowLabelComponent } from './forms/RowLabel.js'

export type {
  BuildTableStateArgs,
  DefaultServerFunctionArgs,
  ListQuery,
  ServerFunction,
  ServerFunctionArgs,
  ServerFunctionClient,
  ServerFunctionClientArgs,
  ServerFunctionConfig,
  ServerFunctionHandler,
} from './functions/index.js'

export type MappedServerComponent<TComponentClientProps extends JsonObject = JsonObject> = {
  Component?: React.ComponentType<TComponentClientProps>
  props?: Partial<any>
  RenderedComponent: React.ReactNode
  type: 'server'
}

export type MappedClientComponent<TComponentClientProps extends JsonObject = JsonObject> = {
  Component?: React.ComponentType<TComponentClientProps>
  props?: Partial<TComponentClientProps>
  RenderedComponent?: React.ReactNode
  type: 'client'
}

export type MappedEmptyComponent = {
  type: 'empty'
}

export enum Action {
  RenderConfig = 'render-config',
}

export type RenderEntityConfigArgs = {
  collectionSlug?: string
  data?: Data
  globalSlug?: string
}

export type RenderRootConfigArgs = {}

export type RenderFieldConfigArgs = {
  collectionSlug?: string
  formState?: FormState
  globalSlug?: string
  schemaPath: string
}

export type RenderConfigArgs = {
  action: Action.RenderConfig
  config: Promise<SanitizedConfig> | SanitizedConfig
  i18n: I18nClient
  importMap: ImportMap
  languageCode: AcceptedLanguages
  serverProps?: any
} & (RenderEntityConfigArgs | RenderFieldConfigArgs | RenderRootConfigArgs)

export type PayloadServerAction = (
  args:
    | {
        [key: string]: any
        action: Action
        i18n: I18nClient
      }
    | RenderConfigArgs,
) => Promise<string>

export type RenderedField = {
  Field: React.ReactNode
  indexPath?: string
  initialSchemaPath?: string
  /**
   * @deprecated
   * This is a legacy property that will be removed in v4.
   * Please use `fieldIsSidebar(field)` from `payload` instead.
   * Or check `field.admin.position === 'sidebar'` directly.
   */
  isSidebar: boolean
  path: string
  schemaPath: string
  type: FieldTypes
}

export type FieldRow = {
  RowLabel?: React.ReactNode
}

export type DocumentSlots = {
  Description?: React.ReactNode
  PreviewButton?: React.ReactNode
  PublishButton?: React.ReactNode
  SaveButton?: React.ReactNode
  SaveDraftButton?: React.ReactNode
  Upload?: React.ReactNode
}

export type { LanguageOptions } from './LanguageOptions.js'

export type { RichTextAdapter, RichTextAdapterProvider, RichTextHooks } from './RichText.js'

export type {
  AdminViewComponent,
  AdminViewConfig,
  AdminViewProps,
  ClientSideEditViewProps,
  EditViewProps,
  InitPageResult,
  ServerSideEditViewProps,
  VisibleEntities,
} from './views/types.js'

type SchemaPath = {} & string
export type FieldSchemaMap = Map<
  SchemaPath,
  | {
      fields: Field[]
    }
  | Block
  | Field
  | Tab
>

export type ClientFieldSchemaMap = Map<
  SchemaPath,
  | {
      fields: ClientField[]
    }
  | ClientBlock
  | ClientField
  | ClientTab
>

export type DocumentEvent = {
  entitySlug: string
  id?: number | string
  updatedAt: string
}
