import type { EditorProps } from '@monaco-editor/react'
import type { MarkOptional } from 'ts-essentials'

import type { CodeField, CodeFieldClient } from '../../fields/config/types.js'
import type { CodeFieldValidation } from '../../fields/validations.js'
import type { FieldErrorClientProps, FieldErrorServerProps } from '../forms/Error.js'
import type { ClientFieldBase, FieldPaths, ServerFieldBase } from '../forms/Field.js'
import type {
  FieldDescriptionClientProps,
  FieldDescriptionServerProps,
  FieldDiffClientProps,
  FieldDiffServerProps,
  FieldLabelClientProps,
  FieldLabelServerProps,
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
export type CodeFieldLabelServerProps = FieldLabelServerProps<CodeField, CodeFieldClientWithoutType>

export type CodeFieldLabelClientProps = FieldLabelClientProps<CodeFieldClientWithoutType>

export type CodeFieldDescriptionServerProps = FieldDescriptionServerProps<
  CodeField,
  CodeFieldClientWithoutType
>

export type CodeFieldDescriptionClientProps =
  FieldDescriptionClientProps<CodeFieldClientWithoutType>

export type CodeFieldErrorServerProps = FieldErrorServerProps<CodeField, CodeFieldClientWithoutType>

export type CodeFieldErrorClientProps = FieldErrorClientProps<CodeFieldClientWithoutType>

export type CodeFieldDiffServerProps = FieldDiffServerProps<CodeField, CodeFieldClient>

export type CodeFieldDiffClientProps = FieldDiffClientProps<CodeFieldClient>
