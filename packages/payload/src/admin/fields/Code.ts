import type { EditorProps } from '@monaco-editor/react'
import type { MarkOptional } from 'ts-essentials'

import type { CodeField, CodeFieldClient } from '../../fields/config/types.js'
import type { CodeFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientComponent, FieldErrorServerComponent } from '../forms/Error.js'
import type {
  ClientFieldBase,
  FieldClientComponent,
  FieldPaths,
  FieldServerComponent,
  ServerFieldBase,
} from '../forms/Field.js'
import type {
  FieldDescriptionClientComponent,
  FieldDescriptionServerComponent,
  FieldDiffClientComponent,
  FieldDiffServerComponent,
  FieldLabelClientComponent,
  FieldLabelServerComponent,
} from '../types.js'

type CodeFieldClientWithoutType = MarkOptional<CodeFieldClient, 'type'>

type CodeFieldBaseClientProps = {
  readonly autoComplete?: string
  readonly onMount?: EditorProps['onMount']
  readonly path: string
  readonly validate?: CodeFieldValidation
}

type CodeFieldBaseServerProps = Pick<FieldPaths, 'path'>

export type CodeFieldClientProps = ClientFieldBase<CodeFieldClientWithoutType> &
  CodeFieldBaseClientProps

export type CodeFieldServerProps = CodeFieldBaseServerProps &
  ServerFieldBase<CodeField, CodeFieldClientWithoutType>

export type CodeFieldServerComponent<T extends Record<string, unknown> = {}> = FieldServerComponent<
  CodeField,
  CodeFieldClientWithoutType,
  CodeFieldBaseServerProps & T
>

export type CodeFieldClientComponent<T extends Record<string, unknown> = {}> = FieldClientComponent<
  CodeFieldClientWithoutType,
  CodeFieldBaseClientProps & T
>

export type CodeFieldLabelServerComponent = FieldLabelServerComponent<
  CodeField,
  CodeFieldClientWithoutType
>

export type CodeFieldLabelClientComponent = FieldLabelClientComponent<CodeFieldClientWithoutType>

export type CodeFieldDescriptionServerComponent = FieldDescriptionServerComponent<
  CodeField,
  CodeFieldClientWithoutType
>

export type CodeFieldDescriptionClientComponent =
  FieldDescriptionClientComponent<CodeFieldClientWithoutType>

export type CodeFieldErrorServerComponent = FieldErrorServerComponent<
  CodeField,
  CodeFieldClientWithoutType
>

export type CodeFieldErrorClientComponent = FieldErrorClientComponent<CodeFieldClientWithoutType>

export type CodeFieldDiffServerComponent = FieldDiffServerComponent<CodeField, CodeFieldClient>

export type CodeFieldDiffClientComponent = FieldDiffClientComponent<CodeFieldClient>
