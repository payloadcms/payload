import type React from 'react'

import type { PayloadComponent } from '../config/types.js'
import type { JsonObject } from '../types/index.js'

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
  ArrayFieldDescriptionClientComponent,
  ArrayFieldDescriptionServerComponent,
  ArrayFieldErrorClientComponent,
  ArrayFieldErrorServerComponent,
  ArrayFieldLabelClientComponent,
  ArrayFieldLabelServerComponent,
  ArrayFieldProps,
} from './fields/Array.js'

export type {
  BlockFieldDescriptionClientComponent,
  BlockFieldDescriptionServerComponent,
  BlockFieldErrorClientComponent,
  BlockFieldErrorServerComponent,
  BlockFieldLabelClientComponent,
  BlockFieldLabelServerComponent,
  BlockFieldProps,
} from './fields/Blocks.js'

export type {
  CheckboxFieldDescriptionClientComponent,
  CheckboxFieldDescriptionServerComponent,
  CheckboxFieldErrorClientComponent,
  CheckboxFieldErrorServerComponent,
  CheckboxFieldLabelClientComponent,
  CheckboxFieldLabelServerComponent,
  CheckboxFieldProps,
} from './fields/Checkbox.js'

export type {
  CodeFieldDescriptionClientComponent,
  CodeFieldDescriptionServerComponent,
  CodeFieldErrorClientComponent,
  CodeFieldErrorServerComponent,
  CodeFieldLabelClientComponent,
  CodeFieldLabelServerComponent,
  CodeFieldProps,
} from './fields/Code.js'

export type {
  CollapsibleFieldDescriptionClientComponent,
  CollapsibleFieldDescriptionServerComponent,
  CollapsibleFieldErrorClientComponent,
  CollapsibleFieldErrorServerComponent,
  CollapsibleFieldLabelClientComponent,
  CollapsibleFieldLabelServerComponent,
  CollapsibleFieldProps,
} from './fields/Collapsible.js'

export type {
  DateFieldDescriptionClientComponent,
  DateFieldDescriptionServerComponent,
  DateFieldErrorClientComponent,
  DateFieldErrorServerComponent,
  DateFieldLabelClientComponent,
  DateFieldLabelServerComponent,
  DateFieldProps,
} from './fields/Date.js'

export type {
  EmailFieldDescriptionClientComponent,
  EmailFieldDescriptionServerComponent,
  EmailFieldErrorClientComponent,
  EmailFieldErrorServerComponent,
  EmailFieldLabelClientComponent,
  EmailFieldLabelServerComponent,
  EmailFieldProps,
} from './fields/Email.js'

export type {
  GroupFieldDescriptionClientComponent,
  GroupFieldDescriptionServerComponent,
  GroupFieldErrorClientComponent,
  GroupFieldErrorServerComponent,
  GroupFieldLabelClientComponent,
  GroupFieldLabelServerComponent,
  GroupFieldProps,
} from './fields/Group.js'

export type { HiddenFieldProps } from './fields/Hidden.js'

export type {
  JSONFieldDescriptionClientComponent,
  JSONFieldDescriptionServerComponent,
  JSONFieldErrorClientComponent,
  JSONFieldErrorServerComponent,
  JSONFieldLabelClientComponent,
  JSONFieldLabelServerComponent,
  JSONFieldProps,
} from './fields/JSON.js'

export type {
  NumberFieldDescriptionClientComponent,
  NumberFieldDescriptionServerComponent,
  NumberFieldErrorClientComponent,
  NumberFieldErrorServerComponent,
  NumberFieldLabelClientComponent,
  NumberFieldLabelServerComponent,
  NumberFieldProps,
} from './fields/Number.js'

export type {
  PointFieldDescriptionClientComponent,
  PointFieldDescriptionServerComponent,
  PointFieldErrorClientComponent,
  PointFieldErrorServerComponent,
  PointFieldLabelClientComponent,
  PointFieldLabelServerComponent,
  PointFieldProps,
} from './fields/Point.js'

export type {
  RadioFieldDescriptionClientComponent,
  RadioFieldDescriptionServerComponent,
  RadioFieldErrorClientComponent,
  RadioFieldErrorServerComponent,
  RadioFieldLabelClientComponent,
  RadioFieldLabelServerComponent,
  RadioFieldProps,
} from './fields/Radio.js'

export type {
  RelationshipFieldDescriptionClientComponent,
  RelationshipFieldDescriptionServerComponent,
  RelationshipFieldErrorClientComponent,
  RelationshipFieldErrorServerComponent,
  RelationshipFieldLabelClientComponent,
  RelationshipFieldLabelServerComponent,
  RelationshipFieldProps,
} from './fields/Relationship.js'

export type {
  RichTextFieldDescriptionClientComponent,
  RichTextFieldDescriptionServerComponent,
  RichTextFieldErrorClientComponent,
  RichTextFieldErrorServerComponent,
  RichTextFieldLabelClientComponent,
  RichTextFieldLabelServerComponent,
  RichTextFieldProps,
} from './fields/RichText.js'

export type {
  RowFieldDescriptionClientComponent,
  RowFieldDescriptionServerComponent,
  RowFieldErrorClientComponent,
  RowFieldErrorServerComponent,
  RowFieldLabelClientComponent,
  RowFieldLabelServerComponent,
  RowFieldProps,
} from './fields/Row.js'

export type {
  SelectFieldDescriptionClientComponent,
  SelectFieldDescriptionServerComponent,
  SelectFieldErrorClientComponent,
  SelectFieldErrorServerComponent,
  SelectFieldLabelClientComponent,
  SelectFieldLabelServerComponent,
  SelectFieldProps,
} from './fields/Select.js'

export type {
  ClientTab,
  TabsFieldDescriptionClientComponent,
  TabsFieldDescriptionServerComponent,
  TabsFieldErrorClientComponent,
  TabsFieldErrorServerComponent,
  TabsFieldLabelClientComponent,
  TabsFieldLabelServerComponent,
  TabsFieldProps,
} from './fields/Tabs.js'

export type {
  TextFieldDescriptionClientComponent,
  TextFieldDescriptionServerComponent,
  TextFieldErrorClientComponent,
  TextFieldErrorServerComponent,
  TextFieldLabelClientComponent,
  TextFieldLabelServerComponent,
  TextFieldProps,
} from './fields/Text.js'

export type {
  TextareaFieldDescriptionClientComponent,
  TextareaFieldDescriptionServerComponent,
  TextareaFieldErrorClientComponent,
  TextareaFieldErrorServerComponent,
  TextareaFieldLabelClientComponent,
  TextareaFieldLabelServerComponent,
  TextareaFieldProps,
} from './fields/Textarea.js'

export type {
  UploadFieldDescriptionClientComponent,
  UploadFieldDescriptionServerComponent,
  UploadFieldErrorClientComponent,
  UploadFieldErrorServerComponent,
  UploadFieldLabelClientComponent,
  UploadFieldLabelServerComponent,
  UploadFieldProps,
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

export type { FormFieldBase } from './forms/Field.js'

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

export type MappedComponent<TComponentClientProps extends JsonObject = JsonObject> =
  | MappedClientComponent<TComponentClientProps>
  | MappedEmptyComponent
  | MappedServerComponent<TComponentClientProps>
  | undefined

export type CreateMappedComponent = {
  <T extends JsonObject>(
    component: { Component: React.FC<T> } | null | PayloadComponent<T>,
    props: {
      clientProps?: JsonObject
      serverProps?: object
    },
    fallback: React.FC,
    identifier: string,
  ): MappedComponent<T>

  <T extends JsonObject>(
    components: ({ Component: React.FC<T> } | PayloadComponent<T>)[],
    props: {
      clientProps?: JsonObject
      serverProps?: object
    },
    fallback: React.FC,
    identifier: string,
  ): MappedComponent<T>[]
}
