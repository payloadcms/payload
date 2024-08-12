import type React from 'react'

import type { PayloadComponent } from '../config/types.js'
import type { JsonObject } from '../types/index.js'

export type { LanguageOptions } from './LanguageOptions.js'
export type {
  RichTextAdapter,
  RichTextAdapterProvider,
  RichTextGenerateComponentMap,
  RichTextHooks,
} from './RichText.js'
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
  ArrayFieldDescriptionComponent,
  ArrayFieldErrorComponent,
  ArrayFieldLabelComponent,
  ArrayFieldProps,
} from './fields/Array.js'

export type {
  BlockFieldDescriptionComponent,
  BlockFieldErrorComponent,
  BlockFieldLabelComponent,
  BlockFieldProps,
} from './fields/Blocks.js'

export type {
  CheckboxFieldDescriptionComponent,
  CheckboxFieldErrorComponent,
  CheckboxFieldLabelComponent,
  CheckboxFieldProps,
} from './fields/Checkbox.js'

export type {
  CodeFieldDescriptionComponent,
  CodeFieldErrorComponent,
  CodeFieldLabelComponent,
  CodeFieldProps,
} from './fields/Code.js'

export type {
  CollapsibleFieldDescriptionComponent,
  CollapsibleFieldErrorComponent,
  CollapsibleFieldLabelComponent,
  CollapsibleFieldProps,
} from './fields/Collapsible.js'

export type {
  DateFieldDescriptionComponent,
  DateFieldErrorComponent,
  DateFieldLabelComponent,
  DateFieldProps,
} from './fields/Date.js'

export type {
  EmailFieldDescriptionComponent,
  EmailFieldErrorComponent,
  EmailFieldLabelComponent,
  EmailFieldProps,
} from './fields/Email.js'

export type {
  GroupFieldDescriptionComponent,
  GroupFieldErrorComponent,
  GroupFieldLabelComponent,
  GroupFieldProps,
} from './fields/Group.js'

export type {
  HiddenFieldDescriptionComponent,
  HiddenFieldErrorComponent,
  HiddenFieldLabelComponent,
  HiddenFieldProps,
} from './fields/Hidden.js'

export type {
  JSONFieldDescriptionComponent,
  JSONFieldErrorComponent,
  JSONFieldLabelComponent,
  JSONFieldProps,
} from './fields/JSON.js'

export type {
  NumberFieldDescriptionComponent,
  NumberFieldErrorComponent,
  NumberFieldLabelComponent,
  NumberFieldProps,
} from './fields/Number.js'

export type {
  PointFieldDescriptionComponent,
  PointFieldErrorComponent,
  PointFieldLabelComponent,
  PointFieldProps,
} from './fields/Point.js'

export type {
  RadioFieldDescriptionComponent,
  RadioFieldErrorComponent,
  RadioFieldLabelComponent,
  RadioFieldProps,
} from './fields/Radio.js'

export type {
  RelationshipFieldDescriptionComponent,
  RelationshipFieldErrorComponent,
  RelationshipFieldLabelComponent,
  RelationshipFieldProps,
} from './fields/Relationship.js'

export type {
  RichTextFieldDescriptionComponent,
  RichTextFieldErrorComponent,
  RichTextFieldLabelComponent,
  RichTextFieldProps,
} from './fields/RichText.js'

export type {
  RowFieldDescriptionComponent,
  RowFieldErrorComponent,
  RowFieldLabelComponent,
  RowFieldProps,
} from './fields/Row.js'

export type {
  SelectFieldDescriptionComponent,
  SelectFieldErrorComponent,
  SelectFieldLabelComponent,
  SelectFieldProps,
} from './fields/Select.js'

export type {
  ClientTab,
  TabsFieldDescriptionComponent,
  TabsFieldErrorComponent,
  TabsFieldLabelComponent,
  TabsFieldProps,
} from './fields/Tabs.js'

export type {
  TextFieldDescriptionComponent,
  TextFieldErrorComponent,
  TextFieldLabelComponent,
  TextFieldProps,
} from './fields/Text.js'

export type {
  TextareaFieldDescriptionComponent,
  TextareaFieldErrorComponent,
  TextareaFieldLabelComponent,
  TextareaFieldProps,
} from './fields/Textarea.js'

export type {
  UploadFieldDescriptionComponent,
  UploadFieldErrorComponent,
  UploadFieldLabelComponent,
  UploadFieldProps,
} from './fields/Upload.js'

export type { ErrorComponent, ErrorProps, GenericErrorProps } from './forms/Error.js'

export type { FormFieldBase } from './forms/Field.js'

export type {
  Description,
  DescriptionComponent,
  DescriptionFunction,
  FieldDescriptionProps,
  GenericDescriptionProps,
  StaticDescription,
} from './forms/FieldDescription.js'

export type { Data, FilterOptionsResult, FormField, FormState, Row } from './forms/Form.js'

export type {
  GenericLabelProps,
  LabelComponent,
  LabelProps,
  SanitizedLabelProps,
} from './forms/Label.js'

export type { RowLabel, RowLabelComponent } from './forms/RowLabel.js'

export type {
  AdminViewComponent,
  AdminViewProps,
  EditViewProps,
  InitPageResult,
  ServerSideEditViewProps,
  VisibleEntities,
} from './views/types.js'

export type MappedServerComponent<TComponentClientProps extends JsonObject = JsonObject> = {
  Component: React.ComponentType<TComponentClientProps>
  RenderedComponent: React.ReactNode
  props?: Partial<any>
  type: 'server'
}

export type MappedClientComponent<TComponentClientProps extends JsonObject = JsonObject> = {
  Component: React.ComponentType<TComponentClientProps>
  RenderedComponent?: React.ReactNode
  props?: Partial<TComponentClientProps>
  type: 'client'
}

export type MappedComponent<TComponentClientProps extends JsonObject = JsonObject> =
  | MappedClientComponent<TComponentClientProps>
  | MappedServerComponent<TComponentClientProps>
  | undefined

export type CreateMappedComponent = {
  <T extends JsonObject>(
    component: { Component: React.FC<T> } | PayloadComponent<T> | null,
    props: object,
    fallback: React.FC,
    identifier: string,
  ): MappedComponent<T>

  <T extends JsonObject>(
    components: ({ Component: React.FC<T> } | PayloadComponent<T>)[],
    props: object,
    fallback: React.FC,
    identifier: string,
  ): MappedComponent<T>[]
}
