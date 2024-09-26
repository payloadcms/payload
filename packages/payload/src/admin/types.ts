import type { AcceptedLanguages, I18nClient } from '@payloadcms/translations'
import type React from 'react'

import type { ImportMap } from '../bin/generateImportMap/index.js'
import type { PayloadComponent, SanitizedConfig } from '../config/types.js'
import type { JsonObject } from '../types/index.js'
import type { Data, FormState } from './types.js'

export type { CellComponentProps, DefaultCellComponentProps } from './elements/Cell.js'
export type { ConditionalDateProps } from './elements/DatePicker.js'
export type { DayPickerProps, SharedProps, TimePickerProps } from './elements/DatePicker.js'
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
  ArrayFieldErrorClientComponent,
  ArrayFieldErrorServerComponent,
  ArrayFieldLabelClientComponent,
  ArrayFieldLabelServerComponent,
  ArrayFieldServerComponent,
  ArrayFieldServerProps,
} from './fields/Array.js'

export type {
  BlocksFieldClientComponent,
  BlocksFieldClientProps,
  BlocksFieldDescriptionClientComponent,
  BlocksFieldDescriptionServerComponent,
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
  TextareaFieldErrorClientComponent,
  TextareaFieldErrorServerComponent,
  TextareaFieldLabelClientComponent,
  TextareaFieldLabelServerComponent,
  TextareaFieldServerComponent,
  TextareaFieldServerProps,
} from './fields/Textarea.js'

export type {
  UploadFieldClientComponent,
  UploadFieldClientProps,
  UploadFieldDescriptionClientComponent,
  UploadFieldDescriptionServerComponent,
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
  FieldErrorClientComponent,
  FieldErrorClientProps,
  FieldErrorServerComponent,
  FieldErrorServerProps,
  GenericErrorProps,
} from './forms/Error.js'

export type { FormFieldBase, ServerFieldBase } from './forms/Field.js'

export type { Data, FilterOptionsResult, FormField, FormState, Row } from './forms/Form.js'

export type {
  FieldLabelClientComponent,
  FieldLabelClientProps,
  FieldLabelServerComponent,
  FieldLabelServerProps,
  GenericLabelProps,
  SanitizedLabelProps,
} from './forms/Label.js'

export type { RowLabel, RowLabelComponent } from './forms/RowLabel.js'

export type { LanguageOptions } from './LanguageOptions.js'

export type {
  RichTextAdapter,
  RichTextAdapterProvider,
  RichTextGenerateComponentMap,
  RichTextHooks,
} from './RichText.js'

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

export type MappedServerComponent<TComponentClientProps extends JsonObject = JsonObject> = {
  Component: React.ComponentType<TComponentClientProps>
  props?: Partial<any>
  RenderedComponent: React.ReactNode
  type: 'server'
}

export type MappedClientComponent<TComponentClientProps extends JsonObject = JsonObject> = {
  Component: React.ComponentType<TComponentClientProps>
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

export type FieldSlots = {
  AfterInput?: React.ReactNode
  BeforeInput?: React.ReactNode
  Description?: React.ReactNode
  Error?: React.ReactNode
  Label?: React.ReactNode
}

export type EntitySlots = {
  MainFields: React.ReactNode
  PreviewButton?: React.ReactNode
  PublishButton?: React.ReactNode
  SaveButton?: React.ReactNode
  SaveDraftButton?: React.ReactNode
  SidebarFields: React.ReactNode
}
