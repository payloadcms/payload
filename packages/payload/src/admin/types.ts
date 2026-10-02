import type { AcceptedLanguages, I18nClient } from '@payloadcms/translations'
import type React from 'react'

import type { ImportMap } from '../cli/commands/generateImportMap/generateImportMap.js'
import type { TypeWithID } from '../collections/config/types.js'
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

export type {
  /**
   * @deprecated
   * The `CustomPreviewButton` type is deprecated and will be removed in the next major version.
   * This type is only used for the Payload Config. Use `PreviewButtonClientProps` instead.
   */
  CustomComponent as CustomPreviewButton,
  /**
   * @deprecated
   * The `CustomPublishButton` type is deprecated and will be removed in the next major version.
   * This type is only used for the Payload Config. Use `PreviewButtonClientProps` instead.
   */
  CustomComponent as CustomPublishButton,
  /**
   * @deprecated
   * The `CustomSaveButton` type is deprecated and will be removed in the next major version.
   * This type is only used for the Payload Config. Use `PreviewButtonClientProps` instead.
   */
  CustomComponent as CustomSaveButton,
  /**
   * @deprecated
   * The `CustomSaveDraftButton` type is deprecated and will be removed in the next major version.
   * This type is only used for the Payload Config. Use `PreviewButtonClientProps` instead.
   */
  CustomComponent as CustomSaveDraftButton,
} from '../config/types.js'
export type { DefaultCellComponentProps, DefaultServerCellComponentProps } from './elements/Cell.js'
export type { ConditionalDateProps } from './elements/DatePicker.js'
export type { DayPickerProps, SharedProps, TimePickerProps } from './elements/DatePicker.js'
export type {
  EditMenuItemsClientProps,
  EditMenuItemsServerProps,
  EditMenuItemsServerPropsOnly,
} from './elements/EditMenuItems.js'
export type {
  NavGroupPreferences,
  NavPreferences,
  SidebarTabClientProps,
  SidebarTabServerProps,
  SidebarTabServerPropsOnly,
} from './elements/Nav.js'
export type {
  PreviewButtonClientProps,
  PreviewButtonServerProps,
  PreviewButtonServerPropsOnly,
} from './elements/PreviewButton.js'
export type {
  PublishButtonClientProps,
  PublishButtonServerProps,
  PublishButtonServerPropsOnly,
} from './elements/PublishButton.js'
export type {
  SaveButtonClientProps,
  SaveButtonServerProps,
  SaveButtonServerPropsOnly,
} from './elements/SaveButton.js'
export type {
  SaveDraftButtonClientProps,
  SaveDraftButtonServerProps,
  SaveDraftButtonServerPropsOnly,
} from './elements/SaveDraftButton.js'
export type { CustomStatus } from './elements/Status.js'

export type { Column } from './elements/Table.js'

export type {
  UnpublishButtonClientProps,
  UnpublishButtonServerProps,
  UnpublishButtonServerPropsOnly,
} from './elements/UnpublishButton.js'

export type { CustomUpload } from './elements/Upload.js'

export type {
  WithServerSidePropsComponent,
  WithServerSidePropsComponentProps,
} from './elements/WithServerSideProps.js'

export type {
  ArrayFieldClientProps,
  ArrayFieldDescriptionClientProps,
  ArrayFieldDescriptionServerProps,
  ArrayFieldDiffClientProps,
  ArrayFieldDiffServerProps,
  ArrayFieldErrorClientProps,
  ArrayFieldErrorServerProps,
  ArrayFieldLabelClientProps,
  ArrayFieldLabelServerProps,
  ArrayFieldServerProps,
} from './fields/Array.js'

export type {
  BlockRowLabelClientProps,
  BlockRowLabelServerProps,
  BlocksFieldClientProps,
  BlocksFieldDescriptionClientProps,
  BlocksFieldDescriptionServerProps,
  BlocksFieldDiffClientProps,
  BlocksFieldDiffServerProps,
  BlocksFieldErrorClientProps,
  BlocksFieldErrorServerProps,
  BlocksFieldLabelClientProps,
  BlocksFieldLabelServerProps,
  BlocksFieldServerProps,
} from './fields/Blocks.js'

export type {
  CheckboxFieldClientProps,
  CheckboxFieldDescriptionClientProps,
  CheckboxFieldDescriptionServerProps,
  CheckboxFieldDiffClientProps,
  CheckboxFieldDiffServerProps,
  CheckboxFieldErrorClientProps,
  CheckboxFieldErrorServerProps,
  CheckboxFieldLabelClientProps,
  CheckboxFieldLabelServerProps,
  CheckboxFieldServerProps,
} from './fields/Checkbox.js'

export type {
  CodeFieldClientProps,
  CodeFieldDescriptionClientProps,
  CodeFieldDescriptionServerProps,
  CodeFieldDiffClientProps,
  CodeFieldDiffServerProps,
  CodeFieldErrorClientProps,
  CodeFieldErrorServerProps,
  CodeFieldLabelClientProps,
  CodeFieldLabelServerProps,
  CodeFieldServerProps,
} from './fields/Code.js'

export type {
  CollapsibleFieldClientProps,
  CollapsibleFieldDescriptionClientProps,
  CollapsibleFieldDescriptionServerProps,
  CollapsibleFieldDiffClientProps,
  CollapsibleFieldDiffServerProps,
  CollapsibleFieldErrorClientProps,
  CollapsibleFieldErrorServerProps,
  CollapsibleFieldLabelClientProps,
  CollapsibleFieldLabelServerProps,
  CollapsibleFieldServerProps,
} from './fields/Collapsible.js'

export type {
  DateFieldClientProps,
  DateFieldDescriptionClientProps,
  DateFieldDescriptionServerProps,
  DateFieldDiffClientProps,
  DateFieldDiffServerProps,
  DateFieldErrorClientProps,
  DateFieldErrorServerProps,
  DateFieldLabelClientProps,
  DateFieldLabelServerProps,
  DateFieldServerProps,
} from './fields/Date.js'

export type {
  EmailFieldClientProps,
  EmailFieldDescriptionClientProps,
  EmailFieldDescriptionServerProps,
  EmailFieldDiffClientProps,
  EmailFieldDiffServerProps,
  EmailFieldErrorClientProps,
  EmailFieldErrorServerProps,
  EmailFieldLabelClientProps,
  EmailFieldLabelServerProps,
  EmailFieldServerProps,
} from './fields/Email.js'

export type {
  GroupFieldClientProps,
  GroupFieldDescriptionClientProps,
  GroupFieldDescriptionServerProps,
  GroupFieldDiffClientProps,
  GroupFieldDiffServerProps,
  GroupFieldErrorClientProps,
  GroupFieldErrorServerProps,
  GroupFieldLabelClientProps,
  GroupFieldLabelServerProps,
  GroupFieldServerProps,
} from './fields/Group.js'

export type { HiddenFieldProps } from './fields/Hidden.js'

export type {
  JoinFieldClientProps,
  JoinFieldDescriptionClientProps,
  JoinFieldDescriptionServerProps,
  JoinFieldDiffClientProps,
  JoinFieldDiffServerProps,
  JoinFieldErrorClientProps,
  JoinFieldErrorServerProps,
  JoinFieldLabelClientProps,
  JoinFieldLabelServerProps,
  JoinFieldServerProps,
} from './fields/Join.js'

export type {
  JSONFieldClientProps,
  JSONFieldDescriptionClientProps,
  JSONFieldDescriptionServerProps,
  JSONFieldDiffClientProps,
  JSONFieldDiffServerProps,
  JSONFieldErrorClientProps,
  JSONFieldErrorServerProps,
  JSONFieldLabelClientProps,
  JSONFieldLabelServerProps,
  JSONFieldServerProps,
} from './fields/JSON.js'

export type {
  NumberFieldClientProps,
  NumberFieldDescriptionClientProps,
  NumberFieldDescriptionServerProps,
  NumberFieldDiffClientProps,
  NumberFieldDiffServerProps,
  NumberFieldErrorClientProps,
  NumberFieldErrorServerProps,
  NumberFieldLabelClientProps,
  NumberFieldLabelServerProps,
  NumberFieldServerProps,
} from './fields/Number.js'

export type {
  PointFieldClientProps,
  PointFieldDescriptionClientProps,
  PointFieldDescriptionServerProps,
  PointFieldDiffClientProps,
  PointFieldDiffServerProps,
  PointFieldErrorClientProps,
  PointFieldErrorServerProps,
  PointFieldLabelClientProps,
  PointFieldLabelServerProps,
  PointFieldServerProps,
} from './fields/Point.js'

export type {
  RadioFieldClientProps,
  RadioFieldDescriptionClientProps,
  RadioFieldDescriptionServerProps,
  RadioFieldDiffClientProps,
  RadioFieldDiffServerProps,
  RadioFieldErrorClientProps,
  RadioFieldErrorServerProps,
  RadioFieldLabelClientProps,
  RadioFieldLabelServerProps,
  RadioFieldServerProps,
} from './fields/Radio.js'

export type {
  RelationshipFieldClientProps,
  RelationshipFieldDescriptionClientProps,
  RelationshipFieldDescriptionServerProps,
  RelationshipFieldDiffClientProps,
  RelationshipFieldDiffServerProps,
  RelationshipFieldErrorClientProps,
  RelationshipFieldErrorServerProps,
  RelationshipFieldLabelClientProps,
  RelationshipFieldLabelServerProps,
  RelationshipFieldServerProps,
} from './fields/Relationship.js'

export type {
  RichTextFieldClientProps,
  RichTextFieldDescriptionClientProps,
  RichTextFieldDescriptionServerProps,
  RichTextFieldDiffClientProps,
  RichTextFieldDiffServerProps,
  RichTextFieldErrorClientProps,
  RichTextFieldErrorServerProps,
  RichTextFieldLabelClientProps,
  RichTextFieldLabelServerProps,
  RichTextFieldServerProps,
} from './fields/RichText.js'

export type {
  RowFieldClientProps,
  RowFieldDescriptionClientProps,
  RowFieldDescriptionServerProps,
  RowFieldDiffClientProps,
  RowFieldDiffServerProps,
  RowFieldErrorClientProps,
  RowFieldErrorServerProps,
  RowFieldLabelClientProps,
  RowFieldLabelServerProps,
  RowFieldServerProps,
} from './fields/Row.js'

export type {
  SelectFieldClientProps,
  SelectFieldDescriptionClientProps,
  SelectFieldDescriptionServerProps,
  SelectFieldDiffClientProps,
  SelectFieldDiffServerProps,
  SelectFieldErrorClientProps,
  SelectFieldErrorServerProps,
  SelectFieldLabelClientProps,
  SelectFieldLabelServerProps,
  SelectFieldServerProps,
} from './fields/Select.js'

export type {
  ClientTab,
  TabsFieldClientProps,
  TabsFieldDescriptionClientProps,
  TabsFieldDescriptionServerProps,
  TabsFieldDiffClientProps,
  TabsFieldDiffServerProps,
  TabsFieldErrorClientProps,
  TabsFieldErrorServerProps,
  TabsFieldLabelClientProps,
  TabsFieldLabelServerProps,
  TabsFieldServerProps,
} from './fields/Tabs.js'

export type {
  TextFieldClientProps,
  TextFieldDescriptionClientProps,
  TextFieldDescriptionServerProps,
  TextFieldDiffClientProps,
  TextFieldDiffServerProps,
  TextFieldErrorClientProps,
  TextFieldErrorServerProps,
  TextFieldLabelClientProps,
  TextFieldLabelServerProps,
  TextFieldServerProps,
} from './fields/Text.js'

export type {
  TextareaFieldClientProps,
  TextareaFieldDescriptionClientProps,
  TextareaFieldDescriptionServerProps,
  TextareaFieldDiffClientProps,
  TextareaFieldDiffServerProps,
  TextareaFieldErrorClientProps,
  TextareaFieldErrorServerProps,
  TextareaFieldLabelClientProps,
  TextareaFieldLabelServerProps,
  TextareaFieldServerProps,
} from './fields/Textarea.js'

export type {
  UIFieldClientProps,
  UIFieldDiffClientProps,
  UIFieldDiffServerProps,
  UIFieldServerProps,
} from './fields/UI.js'

export type {
  UploadFieldClientProps,
  UploadFieldDescriptionClientProps,
  UploadFieldDescriptionServerProps,
  UploadFieldDiffClientProps,
  UploadFieldDiffServerProps,
  UploadFieldErrorClientProps,
  UploadFieldErrorServerProps,
  UploadFieldLabelClientProps,
  UploadFieldLabelServerProps,
  UploadFieldServerProps,
} from './fields/Upload.js'

export type {
  Description,
  DescriptionFunction,
  FieldDescriptionClientProps,
  FieldDescriptionServerProps,
  GenericDescriptionProps,
  StaticDescription,
} from './forms/Description.js'

export type {
  BaseVersionField,
  DiffMethod,
  FieldDiffClientProps,
  FieldDiffServerProps,
  VersionField,
  VersionTab,
} from './forms/Diff.js'

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
  FieldErrorClientProps,
  FieldErrorServerProps,
  GenericErrorProps,
} from './forms/Error.js'

export type {
  ClientComponentProps,
  ClientFieldBase,
  ClientFieldWithOptionalType,
  FieldClientProps,
  FieldPaths,
  FieldServerProps,
  ServerComponentProps,
  ServerFieldBase,
} from './forms/Field.js'

export type {
  FieldLabelClientProps,
  FieldLabelServerProps,
  GenericLabelProps,
  SanitizedLabelProps,
} from './forms/Label.js'

export type { RowLabel, RowLabelComponent } from './forms/RowLabel.js'

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
  BeforeDocumentControls?: React.ReactNode
  BeforeDocumentMeta?: React.ReactNode
  Description?: React.ReactNode
  EditMenuItems?: React.ReactNode
  LivePreview?: React.ReactNode
  PreviewButton?: React.ReactNode
  PublishButton?: React.ReactNode
  SaveButton?: React.ReactNode
  SaveDraftButton?: React.ReactNode
  Status?: React.ReactNode
  UnpublishButton?: React.ReactNode
  Upload?: React.ReactNode
  UploadControls?: React.ReactNode
  UploadFilePreview?: React.ReactNode
}

export type {
  AdminContext,
  BuildTableStateArgs,
  DefaultServerFunctionArgs,
  ListQuery,
  ServerFunction,
  ServerFunctionArgs,
  ServerFunctionClient,
  ServerFunctionClientArgs,
  ServerFunctionConfig,
  ServerFunctionHandler,
  SlugifyServerFunctionArgs,
} from './functions/index.js'

export type { LanguageOptions } from './LanguageOptions.js'

export type {
  MarkdownRichTextAdapter,
  MarkdownRichTextAdapterProvider,
  RichTextAdapter,
  RichTextAdapterProvider,
  RichTextHooks,
} from './RichText.js'

export { type WidgetServerProps } from './views/dashboard.js'

export type {
  BeforeDocumentControlsClientProps,
  BeforeDocumentControlsServerProps,
  BeforeDocumentControlsServerPropsOnly,
  DocumentSubViewTypes,
  DocumentTabClientProps,
  /**
   * @deprecated
   * The `DocumentTabComponent` type is deprecated and will be removed in the next major version.
   * Use `DocumentTabServerProps`or `DocumentTabClientProps` instead.
   */
  DocumentTabComponent,
  DocumentTabCondition,
  DocumentTabConfig,
  /**
   * @deprecated
   * The `DocumentTabProps` type is deprecated and will be removed in the next major version.
   * Use `DocumentTabServerProps` instead.
   */
  DocumentTabServerProps as DocumentTabProps,
  DocumentTabServerProps,
  DocumentTabServerPropsOnly,
  /**
   * @deprecated
   * The `ClientSideEditViewProps` type is deprecated and will be removed in the next major version.
   * Use `DocumentViewClientProps` instead.
   */
  DocumentViewClientProps as ClientSideEditViewProps,
  DocumentViewClientProps,
  /**
   * @deprecated
   * The `ServerSideEditViewProps` is deprecated and will be removed in the next major version.
   * Use `DocumentViewServerProps` instead.
   */
  DocumentViewServerProps as ServerSideEditViewProps,
  DocumentViewServerProps,
  DocumentViewServerPropsOnly,
  EditViewProps,
  RenderDocumentVersionsProperties,
} from './views/document.js'

export type { RelatedDocumentsGrouped } from './views/hierarchyList.js'

export type {
  AdminViewClientProps,
  /**
   * @deprecated
   * The `AdminViewComponent` type is deprecated and will be removed in the next major version.
   * Type your component props directly instead.
   */
  AdminViewComponent,
  AdminViewConfig,
  /**
   * @deprecated
   * The `AdminViewProps` type is deprecated and will be removed in the next major version.
   * Use `AdminViewServerProps` instead.
   */
  AdminViewServerProps as AdminViewProps,
  AdminViewServerProps,
  AdminViewServerPropsOnly,
  InitPageResult,
  ServerPropsFromView,
  ViewDescriptionClientProps,
  ViewDescriptionServerProps,
  ViewDescriptionServerPropsOnly,
  ViewTypes,
  VisibleEntities,
} from './views/index.js'

export type {
  AfterListClientProps,
  AfterListServerProps,
  AfterListServerPropsOnly,
  AfterListTableClientProps,
  AfterListTableServerProps,
  AfterListTableServerPropsOnly,
  BeforeListClientProps,
  BeforeListServerProps,
  BeforeListServerPropsOnly,
  BeforeListTableClientProps,
  BeforeListTableServerProps,
  BeforeListTableServerPropsOnly,
  HierarchyViewData,
  ListViewClientProps,
  ListViewServerProps,
  ListViewServerPropsOnly,
  ListViewSlots,
  ListViewSlotSharedClientProps,
  NoResultsClientProps,
  NoResultsServerProps,
  NoResultsServerPropsOnly,
} from './views/list.js'

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
  doc?: TypeWithID
  drawerSlug?: string
  entitySlug: string
  id?: number | string
  operation: 'create' | 'delete' | 'update'
  updatedAt: string
}
