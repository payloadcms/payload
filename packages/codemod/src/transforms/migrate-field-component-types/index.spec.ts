import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { transforms } from '../../registry.js'
import { runTransform } from '../../utils/test-helpers.js'
import { migrateFieldComponentTypes } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

const removedComponentToProps = [
  ['FieldClientComponent', 'FieldClientProps'],
  ['FieldServerComponent', 'FieldServerProps'],
  ['FieldLabelClientComponent', 'FieldLabelClientProps'],
  ['FieldLabelServerComponent', 'FieldLabelServerProps'],
  ['FieldDescriptionClientComponent', 'FieldDescriptionClientProps'],
  ['FieldDescriptionServerComponent', 'FieldDescriptionServerProps'],
  ['FieldErrorClientComponent', 'FieldErrorClientProps'],
  ['FieldErrorServerComponent', 'FieldErrorServerProps'],
  ['FieldDiffClientComponent', 'FieldDiffClientProps'],
  ['FieldDiffServerComponent', 'FieldDiffServerProps'],
  ['BlockRowLabelClientComponent', 'BlockRowLabelClientProps'],
  ['BlockRowLabelServerComponent', 'BlockRowLabelServerProps'],
  ['ArrayFieldClientComponent', 'ArrayFieldClientProps'],
  ['ArrayFieldServerComponent', 'ArrayFieldServerProps'],
  ['BlocksFieldClientComponent', 'BlocksFieldClientProps'],
  ['BlocksFieldServerComponent', 'BlocksFieldServerProps'],
  ['CheckboxFieldClientComponent', 'CheckboxFieldClientProps'],
  ['CheckboxFieldServerComponent', 'CheckboxFieldServerProps'],
  ['CodeFieldClientComponent', 'CodeFieldClientProps'],
  ['CodeFieldServerComponent', 'CodeFieldServerProps'],
  ['CollapsibleFieldClientComponent', 'CollapsibleFieldClientProps'],
  ['CollapsibleFieldServerComponent', 'CollapsibleFieldServerProps'],
  ['DateFieldClientComponent', 'DateFieldClientProps'],
  ['DateFieldServerComponent', 'DateFieldServerProps'],
  ['EmailFieldClientComponent', 'EmailFieldClientProps'],
  ['EmailFieldServerComponent', 'EmailFieldServerProps'],
  ['GroupFieldClientComponent', 'GroupFieldClientProps'],
  ['GroupFieldServerComponent', 'GroupFieldServerProps'],
  ['JoinFieldClientComponent', 'JoinFieldClientProps'],
  ['JoinFieldServerComponent', 'JoinFieldServerProps'],
  ['JSONFieldClientComponent', 'JSONFieldClientProps'],
  ['JSONFieldServerComponent', 'JSONFieldServerProps'],
  ['NumberFieldClientComponent', 'NumberFieldClientProps'],
  ['NumberFieldServerComponent', 'NumberFieldServerProps'],
  ['PointFieldClientComponent', 'PointFieldClientProps'],
  ['PointFieldServerComponent', 'PointFieldServerProps'],
  ['RadioFieldClientComponent', 'RadioFieldClientProps'],
  ['RadioFieldServerComponent', 'RadioFieldServerProps'],
  ['RelationshipFieldClientComponent', 'RelationshipFieldClientProps'],
  ['RelationshipFieldServerComponent', 'RelationshipFieldServerProps'],
  ['RichTextFieldClientComponent', 'RichTextFieldClientProps'],
  ['RichTextFieldServerComponent', 'RichTextFieldServerProps'],
  ['RowFieldClientComponent', 'RowFieldClientProps'],
  ['RowFieldServerComponent', 'RowFieldServerProps'],
  ['SelectFieldClientComponent', 'SelectFieldClientProps'],
  ['SelectFieldServerComponent', 'SelectFieldServerProps'],
  ['TabsFieldClientComponent', 'TabsFieldClientProps'],
  ['TabsFieldServerComponent', 'TabsFieldServerProps'],
  ['TextFieldClientComponent', 'TextFieldClientProps'],
  ['TextFieldServerComponent', 'TextFieldServerProps'],
  ['TextareaFieldClientComponent', 'TextareaFieldClientProps'],
  ['TextareaFieldServerComponent', 'TextareaFieldServerProps'],
  ['UIFieldClientComponent', 'UIFieldClientProps'],
  ['UIFieldServerComponent', 'UIFieldServerProps'],
  ['UploadFieldClientComponent', 'UploadFieldClientProps'],
  ['UploadFieldServerComponent', 'UploadFieldServerProps'],
  ['ArrayFieldDescriptionClientComponent', 'ArrayFieldDescriptionClientProps'],
  ['ArrayFieldDescriptionServerComponent', 'ArrayFieldDescriptionServerProps'],
  ['ArrayFieldDiffClientComponent', 'ArrayFieldDiffClientProps'],
  ['ArrayFieldDiffServerComponent', 'ArrayFieldDiffServerProps'],
  ['ArrayFieldErrorClientComponent', 'ArrayFieldErrorClientProps'],
  ['ArrayFieldErrorServerComponent', 'ArrayFieldErrorServerProps'],
  ['ArrayFieldLabelClientComponent', 'ArrayFieldLabelClientProps'],
  ['ArrayFieldLabelServerComponent', 'ArrayFieldLabelServerProps'],
  ['BlocksFieldDescriptionClientComponent', 'BlocksFieldDescriptionClientProps'],
  ['BlocksFieldDescriptionServerComponent', 'BlocksFieldDescriptionServerProps'],
  ['BlocksFieldDiffClientComponent', 'BlocksFieldDiffClientProps'],
  ['BlocksFieldDiffServerComponent', 'BlocksFieldDiffServerProps'],
  ['BlocksFieldErrorClientComponent', 'BlocksFieldErrorClientProps'],
  ['BlocksFieldErrorServerComponent', 'BlocksFieldErrorServerProps'],
  ['BlocksFieldLabelClientComponent', 'BlocksFieldLabelClientProps'],
  ['BlocksFieldLabelServerComponent', 'BlocksFieldLabelServerProps'],
  ['CheckboxFieldDescriptionClientComponent', 'CheckboxFieldDescriptionClientProps'],
  ['CheckboxFieldDescriptionServerComponent', 'CheckboxFieldDescriptionServerProps'],
  ['CheckboxFieldDiffClientComponent', 'CheckboxFieldDiffClientProps'],
  ['CheckboxFieldDiffServerComponent', 'CheckboxFieldDiffServerProps'],
  ['CheckboxFieldErrorClientComponent', 'CheckboxFieldErrorClientProps'],
  ['CheckboxFieldErrorServerComponent', 'CheckboxFieldErrorServerProps'],
  ['CheckboxFieldLabelClientComponent', 'CheckboxFieldLabelClientProps'],
  ['CheckboxFieldLabelServerComponent', 'CheckboxFieldLabelServerProps'],
  ['CodeFieldDescriptionClientComponent', 'CodeFieldDescriptionClientProps'],
  ['CodeFieldDescriptionServerComponent', 'CodeFieldDescriptionServerProps'],
  ['CodeFieldDiffClientComponent', 'CodeFieldDiffClientProps'],
  ['CodeFieldDiffServerComponent', 'CodeFieldDiffServerProps'],
  ['CodeFieldErrorClientComponent', 'CodeFieldErrorClientProps'],
  ['CodeFieldErrorServerComponent', 'CodeFieldErrorServerProps'],
  ['CodeFieldLabelClientComponent', 'CodeFieldLabelClientProps'],
  ['CodeFieldLabelServerComponent', 'CodeFieldLabelServerProps'],
  ['CollapsibleFieldDescriptionClientComponent', 'CollapsibleFieldDescriptionClientProps'],
  ['CollapsibleFieldDescriptionServerComponent', 'CollapsibleFieldDescriptionServerProps'],
  ['CollapsibleFieldDiffClientComponent', 'CollapsibleFieldDiffClientProps'],
  ['CollapsibleFieldDiffServerComponent', 'CollapsibleFieldDiffServerProps'],
  ['CollapsibleFieldErrorClientComponent', 'CollapsibleFieldErrorClientProps'],
  ['CollapsibleFieldErrorServerComponent', 'CollapsibleFieldErrorServerProps'],
  ['CollapsibleFieldLabelClientComponent', 'CollapsibleFieldLabelClientProps'],
  ['CollapsibleFieldLabelServerComponent', 'CollapsibleFieldLabelServerProps'],
  ['DateFieldDescriptionClientComponent', 'DateFieldDescriptionClientProps'],
  ['DateFieldDescriptionServerComponent', 'DateFieldDescriptionServerProps'],
  ['DateFieldDiffClientComponent', 'DateFieldDiffClientProps'],
  ['DateFieldDiffServerComponent', 'DateFieldDiffServerProps'],
  ['DateFieldErrorClientComponent', 'DateFieldErrorClientProps'],
  ['DateFieldErrorServerComponent', 'DateFieldErrorServerProps'],
  ['DateFieldLabelClientComponent', 'DateFieldLabelClientProps'],
  ['DateFieldLabelServerComponent', 'DateFieldLabelServerProps'],
  ['EmailFieldDescriptionClientComponent', 'EmailFieldDescriptionClientProps'],
  ['EmailFieldDescriptionServerComponent', 'EmailFieldDescriptionServerProps'],
  ['EmailFieldDiffClientComponent', 'EmailFieldDiffClientProps'],
  ['EmailFieldDiffServerComponent', 'EmailFieldDiffServerProps'],
  ['EmailFieldErrorClientComponent', 'EmailFieldErrorClientProps'],
  ['EmailFieldErrorServerComponent', 'EmailFieldErrorServerProps'],
  ['EmailFieldLabelClientComponent', 'EmailFieldLabelClientProps'],
  ['EmailFieldLabelServerComponent', 'EmailFieldLabelServerProps'],
  ['GroupFieldDescriptionClientComponent', 'GroupFieldDescriptionClientProps'],
  ['GroupFieldDescriptionServerComponent', 'GroupFieldDescriptionServerProps'],
  ['GroupFieldDiffClientComponent', 'GroupFieldDiffClientProps'],
  ['GroupFieldDiffServerComponent', 'GroupFieldDiffServerProps'],
  ['GroupFieldErrorClientComponent', 'GroupFieldErrorClientProps'],
  ['GroupFieldErrorServerComponent', 'GroupFieldErrorServerProps'],
  ['GroupFieldLabelClientComponent', 'GroupFieldLabelClientProps'],
  ['GroupFieldLabelServerComponent', 'GroupFieldLabelServerProps'],
  ['JSONFieldDescriptionClientComponent', 'JSONFieldDescriptionClientProps'],
  ['JSONFieldDescriptionServerComponent', 'JSONFieldDescriptionServerProps'],
  ['JSONFieldDiffClientComponent', 'JSONFieldDiffClientProps'],
  ['JSONFieldDiffServerComponent', 'JSONFieldDiffServerProps'],
  ['JSONFieldErrorClientComponent', 'JSONFieldErrorClientProps'],
  ['JSONFieldErrorServerComponent', 'JSONFieldErrorServerProps'],
  ['JSONFieldLabelClientComponent', 'JSONFieldLabelClientProps'],
  ['JSONFieldLabelServerComponent', 'JSONFieldLabelServerProps'],
  ['JoinFieldDescriptionClientComponent', 'JoinFieldDescriptionClientProps'],
  ['JoinFieldDescriptionServerComponent', 'JoinFieldDescriptionServerProps'],
  ['JoinFieldDiffClientComponent', 'JoinFieldDiffClientProps'],
  ['JoinFieldDiffServerComponent', 'JoinFieldDiffServerProps'],
  ['JoinFieldErrorClientComponent', 'JoinFieldErrorClientProps'],
  ['JoinFieldErrorServerComponent', 'JoinFieldErrorServerProps'],
  ['JoinFieldLabelClientComponent', 'JoinFieldLabelClientProps'],
  ['JoinFieldLabelServerComponent', 'JoinFieldLabelServerProps'],
  ['NumberFieldDescriptionClientComponent', 'NumberFieldDescriptionClientProps'],
  ['NumberFieldDescriptionServerComponent', 'NumberFieldDescriptionServerProps'],
  ['NumberFieldDiffClientComponent', 'NumberFieldDiffClientProps'],
  ['NumberFieldDiffServerComponent', 'NumberFieldDiffServerProps'],
  ['NumberFieldErrorClientComponent', 'NumberFieldErrorClientProps'],
  ['NumberFieldErrorServerComponent', 'NumberFieldErrorServerProps'],
  ['NumberFieldLabelClientComponent', 'NumberFieldLabelClientProps'],
  ['NumberFieldLabelServerComponent', 'NumberFieldLabelServerProps'],
  ['PointFieldDescriptionClientComponent', 'PointFieldDescriptionClientProps'],
  ['PointFieldDescriptionServerComponent', 'PointFieldDescriptionServerProps'],
  ['PointFieldDiffClientComponent', 'PointFieldDiffClientProps'],
  ['PointFieldDiffServerComponent', 'PointFieldDiffServerProps'],
  ['PointFieldErrorClientComponent', 'PointFieldErrorClientProps'],
  ['PointFieldErrorServerComponent', 'PointFieldErrorServerProps'],
  ['PointFieldLabelClientComponent', 'PointFieldLabelClientProps'],
  ['PointFieldLabelServerComponent', 'PointFieldLabelServerProps'],
  ['RadioFieldDescriptionClientComponent', 'RadioFieldDescriptionClientProps'],
  ['RadioFieldDescriptionServerComponent', 'RadioFieldDescriptionServerProps'],
  ['RadioFieldDiffClientComponent', 'RadioFieldDiffClientProps'],
  ['RadioFieldDiffServerComponent', 'RadioFieldDiffServerProps'],
  ['RadioFieldErrorClientComponent', 'RadioFieldErrorClientProps'],
  ['RadioFieldErrorServerComponent', 'RadioFieldErrorServerProps'],
  ['RadioFieldLabelClientComponent', 'RadioFieldLabelClientProps'],
  ['RadioFieldLabelServerComponent', 'RadioFieldLabelServerProps'],
  ['RelationshipFieldDescriptionClientComponent', 'RelationshipFieldDescriptionClientProps'],
  ['RelationshipFieldDescriptionServerComponent', 'RelationshipFieldDescriptionServerProps'],
  ['RelationshipFieldDiffClientComponent', 'RelationshipFieldDiffClientProps'],
  ['RelationshipFieldDiffServerComponent', 'RelationshipFieldDiffServerProps'],
  ['RelationshipFieldErrorClientComponent', 'RelationshipFieldErrorClientProps'],
  ['RelationshipFieldErrorServerComponent', 'RelationshipFieldErrorServerProps'],
  ['RelationshipFieldLabelClientComponent', 'RelationshipFieldLabelClientProps'],
  ['RelationshipFieldLabelServerComponent', 'RelationshipFieldLabelServerProps'],
  ['RichTextFieldDescriptionClientComponent', 'RichTextFieldDescriptionClientProps'],
  ['RichTextFieldDescriptionServerComponent', 'RichTextFieldDescriptionServerProps'],
  ['RichTextFieldDiffClientComponent', 'RichTextFieldDiffClientProps'],
  ['RichTextFieldDiffServerComponent', 'RichTextFieldDiffServerProps'],
  ['RichTextFieldErrorClientComponent', 'RichTextFieldErrorClientProps'],
  ['RichTextFieldErrorServerComponent', 'RichTextFieldErrorServerProps'],
  ['RichTextFieldLabelClientComponent', 'RichTextFieldLabelClientProps'],
  ['RichTextFieldLabelServerComponent', 'RichTextFieldLabelServerProps'],
  ['RowFieldDescriptionClientComponent', 'RowFieldDescriptionClientProps'],
  ['RowFieldDescriptionServerComponent', 'RowFieldDescriptionServerProps'],
  ['RowFieldDiffClientComponent', 'RowFieldDiffClientProps'],
  ['RowFieldDiffServerComponent', 'RowFieldDiffServerProps'],
  ['RowFieldErrorClientComponent', 'RowFieldErrorClientProps'],
  ['RowFieldErrorServerComponent', 'RowFieldErrorServerProps'],
  ['RowFieldLabelClientComponent', 'RowFieldLabelClientProps'],
  ['RowFieldLabelServerComponent', 'RowFieldLabelServerProps'],
  ['SelectFieldDescriptionClientComponent', 'SelectFieldDescriptionClientProps'],
  ['SelectFieldDescriptionServerComponent', 'SelectFieldDescriptionServerProps'],
  ['SelectFieldDiffClientComponent', 'SelectFieldDiffClientProps'],
  ['SelectFieldDiffServerComponent', 'SelectFieldDiffServerProps'],
  ['SelectFieldErrorClientComponent', 'SelectFieldErrorClientProps'],
  ['SelectFieldErrorServerComponent', 'SelectFieldErrorServerProps'],
  ['SelectFieldLabelClientComponent', 'SelectFieldLabelClientProps'],
  ['SelectFieldLabelServerComponent', 'SelectFieldLabelServerProps'],
  ['TabsFieldDescriptionClientComponent', 'TabsFieldDescriptionClientProps'],
  ['TabsFieldDescriptionServerComponent', 'TabsFieldDescriptionServerProps'],
  ['TabsFieldDiffClientComponent', 'TabsFieldDiffClientProps'],
  ['TabsFieldDiffServerComponent', 'TabsFieldDiffServerProps'],
  ['TabsFieldErrorClientComponent', 'TabsFieldErrorClientProps'],
  ['TabsFieldErrorServerComponent', 'TabsFieldErrorServerProps'],
  ['TabsFieldLabelClientComponent', 'TabsFieldLabelClientProps'],
  ['TabsFieldLabelServerComponent', 'TabsFieldLabelServerProps'],
  ['TextFieldDescriptionClientComponent', 'TextFieldDescriptionClientProps'],
  ['TextFieldDescriptionServerComponent', 'TextFieldDescriptionServerProps'],
  ['TextFieldDiffClientComponent', 'TextFieldDiffClientProps'],
  ['TextFieldDiffServerComponent', 'TextFieldDiffServerProps'],
  ['TextFieldErrorClientComponent', 'TextFieldErrorClientProps'],
  ['TextFieldErrorServerComponent', 'TextFieldErrorServerProps'],
  ['TextFieldLabelClientComponent', 'TextFieldLabelClientProps'],
  ['TextFieldLabelServerComponent', 'TextFieldLabelServerProps'],
  ['TextareaFieldDescriptionClientComponent', 'TextareaFieldDescriptionClientProps'],
  ['TextareaFieldDescriptionServerComponent', 'TextareaFieldDescriptionServerProps'],
  ['TextareaFieldDiffClientComponent', 'TextareaFieldDiffClientProps'],
  ['TextareaFieldDiffServerComponent', 'TextareaFieldDiffServerProps'],
  ['TextareaFieldErrorClientComponent', 'TextareaFieldErrorClientProps'],
  ['TextareaFieldErrorServerComponent', 'TextareaFieldErrorServerProps'],
  ['TextareaFieldLabelClientComponent', 'TextareaFieldLabelClientProps'],
  ['TextareaFieldLabelServerComponent', 'TextareaFieldLabelServerProps'],
  ['UIFieldDiffClientComponent', 'UIFieldDiffClientProps'],
  ['UIFieldDiffServerComponent', 'UIFieldDiffServerProps'],
  ['UploadFieldDescriptionClientComponent', 'UploadFieldDescriptionClientProps'],
  ['UploadFieldDescriptionServerComponent', 'UploadFieldDescriptionServerProps'],
  ['UploadFieldDiffClientComponent', 'UploadFieldDiffClientProps'],
  ['UploadFieldDiffServerComponent', 'UploadFieldDiffServerProps'],
  ['UploadFieldErrorClientComponent', 'UploadFieldErrorClientProps'],
  ['UploadFieldErrorServerComponent', 'UploadFieldErrorServerProps'],
  ['UploadFieldLabelClientComponent', 'UploadFieldLabelClientProps'],
  ['UploadFieldLabelServerComponent', 'UploadFieldLabelServerProps'],
] as const

const canonicalGenericDefaults = new Map<string, readonly string[]>([
  ['FieldDiffClientComponent', ['ClientFieldWithOptionalType']],
  ['FieldDiffServerComponent', ['Field', 'ClientFieldWithOptionalType']],
  ['FieldErrorServerComponent', ['Field', 'ClientFieldWithOptionalType']],
  ['FieldLabelClientComponent', ['ClientFieldWithOptionalType']],
  ['FieldLabelServerComponent', ['Field', 'ClientFieldWithOptionalType']],
])

describe('migrate-field-component-types', () => {
  it.each(removedComponentToProps)('should migrate %s to %s', async (componentName, propsName) => {
    const source = `import type { ${componentName} } from 'payload'

const Component: ${componentName} = () => null`
    const genericDefaults = canonicalGenericDefaults.get(componentName) ?? []
    const importedTypes = [propsName, ...genericDefaults]
    const propsType = `${propsName}${
      genericDefaults.length > 0 ? `<${genericDefaults.join(', ')}>` : ''
    }`

    expect(
      await runTransform({ filename: 'input.tsx', source, transform: migrateFieldComponentTypes }),
    ).toBe(`import type { ${importedTypes.join(', ')} } from 'payload'
import type React from 'react'

const Component: React.FC<${propsType}> = () => null`)
  })

  it('should preserve generic type arguments inside the props type', async () => {
    const source = `import type {
  BlocksFieldLabelServerComponent,
  FieldErrorClientComponent,
  TextFieldClient,
} from 'payload'

const Error: FieldErrorClientComponent<TextFieldClient> = () => null
const Label: BlocksFieldLabelServerComponent = async () => null`
    const expected = `import type {
  BlocksFieldLabelServerProps,
  FieldErrorClientProps,
  TextFieldClient,
} from 'payload'
import type React from 'react'

const Error: React.FC<FieldErrorClientProps<TextFieldClient>> = () => null
const Label: React.FC<BlocksFieldLabelServerProps> = async () => null`
    const output = await runTransform({
      filename: 'input.tsx',
      source,
      transform: migrateFieldComponentTypes,
    })

    expect(output).toBe(expected)

    const project = new Project({
      compilerOptions: { esModuleInterop: true, noEmit: true, strict: true },
      useInMemoryFileSystem: true,
    })

    project.createSourceFile(
      '/node_modules/react/index.d.ts',
      `declare namespace React { type FC<Props> = (props: Props) => unknown }
export = React`,
    )
    project.createSourceFile(
      '/node_modules/payload/index.d.ts',
      `export type BlocksFieldLabelServerProps = Record<string, unknown>
export type FieldErrorClientProps<T> = { field: T }
export type TextFieldClient = { type: 'text' }`,
    )
    project.createSourceFile('/output.ts', output)

    expect(
      project.getPreEmitDiagnostics().map((diagnostic) => diagnostic.getMessageText()),
    ).toEqual([])
  })

  it('should migrate local references when the removed alias declaration is resolvable', async () => {
    const source = `import type { TextFieldClientComponent } from 'payload'

const Field: TextFieldClientComponent = () => null`
    const project = new Project({ useInMemoryFileSystem: true })

    project.createSourceFile(
      '/node_modules/payload/index.d.ts',
      `export type TextFieldClientComponent = (props: TextFieldClientProps) => unknown
export type TextFieldClientProps = Record<string, unknown>`,
    )
    const file = project.createSourceFile('/input.tsx', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(`import type { TextFieldClientProps } from 'payload'
import type React from 'react'

const Field: React.FC<TextFieldClientProps> = () => null`)
    expect(result.notes).toBeUndefined()
  })

  it('should preserve omitted canonical generic defaults', async () => {
    const source = `import type { FieldDiffClientComponent, FieldDiffServerComponent, FieldErrorServerComponent, FieldLabelClientComponent, FieldLabelServerComponent, TextField } from 'payload'

const DiffClient: FieldDiffClientComponent = () => null
const DiffServer: FieldDiffServerComponent = () => null
const DiffServerWithField: FieldDiffServerComponent<TextField> = () => null
const ErrorServer: FieldErrorServerComponent = () => null
const ErrorServerWithField: FieldErrorServerComponent<TextField> = () => null
const LabelClient: FieldLabelClientComponent = () => null
const LabelServer: FieldLabelServerComponent = () => null
const LabelServerWithField: FieldLabelServerComponent<TextField> = () => null`
    const expected = `import type { FieldDiffClientProps, FieldDiffServerProps, FieldErrorServerProps, FieldLabelClientProps, FieldLabelServerProps, TextField, ClientFieldWithOptionalType, Field } from 'payload'
import type React from 'react'

const DiffClient: React.FC<FieldDiffClientProps<ClientFieldWithOptionalType>> = () => null
const DiffServer: React.FC<FieldDiffServerProps<Field, ClientFieldWithOptionalType>> = () => null
const DiffServerWithField: React.FC<FieldDiffServerProps<TextField, ClientFieldWithOptionalType>> = () => null
const ErrorServer: React.FC<FieldErrorServerProps<Field, ClientFieldWithOptionalType>> = () => null
const ErrorServerWithField: React.FC<FieldErrorServerProps<TextField, ClientFieldWithOptionalType>> = () => null
const LabelClient: React.FC<FieldLabelClientProps<ClientFieldWithOptionalType>> = () => null
const LabelServer: React.FC<FieldLabelServerProps<Field, ClientFieldWithOptionalType>> = () => null
const LabelServerWithField: React.FC<FieldLabelServerProps<TextField, ClientFieldWithOptionalType>> = () => null`
    const output = await runTransform({
      filename: 'input.tsx',
      source,
      transform: migrateFieldComponentTypes,
    })

    expect(output).toBe(expected)

    const project = new Project({
      compilerOptions: { esModuleInterop: true, noEmit: true, strict: true },
      useInMemoryFileSystem: true,
    })

    project.createSourceFile(
      '/node_modules/react/index.d.ts',
      `declare namespace React { type FC<Props> = (props: Props) => unknown }
export = React`,
    )
    project.createSourceFile(
      '/node_modules/payload/index.d.ts',
      `export type Field = { name?: string }
export type ClientField = { type: string }
export type ClientFieldWithOptionalType = { type?: string }
export type TextField = Field & { type: 'text' }
export type FieldDiffClientProps<T extends ClientFieldWithOptionalType = ClientField> = { field: T }
export type FieldDiffServerProps<TField extends Field = Field, TClient extends ClientFieldWithOptionalType = ClientField> = { clientField: TClient; field: TField }
export type FieldErrorServerProps<TField extends Field, TClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = { clientField: TClient; field: TField }
export type FieldLabelClientProps<T extends Partial<ClientFieldWithOptionalType> = Partial<ClientFieldWithOptionalType>> = { field?: T }
export type FieldLabelServerProps<TField extends Field, TClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType> = { clientField: TClient; field: TField }`,
    )
    project.createSourceFile('/output.ts', output)

    expect(
      project.getPreEmitDiagnostics().map((diagnostic) => diagnostic.getMessageText()),
    ).toEqual([])
  })

  it('should migrate arrow and function component annotations', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    expect(
      await runTransform({
        filename: 'basic.input.ts',
        source: input,
        transform: migrateFieldComponentTypes,
      }),
    ).toBe(output)
    expect(
      await runTransform({
        filename: 'basic.output.ts',
        source: output,
        transform: migrateFieldComponentTypes,
      }),
    ).toBe(output)
  })

  it('should migrate aliased imports and reuse an existing React import', async () => {
    const source = `import React from 'react'
import type { DateFieldServerComponent as ServerField } from 'payload'

const Field: ServerField = async (props) => <span>{props.path}</span>`

    expect(
      await runTransform({ filename: 'input.tsx', source, transform: migrateFieldComponentTypes }),
    ).toBe(
      `import React from 'react'
import type { DateFieldServerProps } from 'payload'

const Field: React.FC<DateFieldServerProps> = async (props) => <span>{props.path}</span>`,
    )
  })

  it('should add React to an existing type-only import', async () => {
    const source = `import type { ReactNode } from 'react'
import type { SelectFieldClientComponent } from 'payload'

const Field: SelectFieldClientComponent = () => null
const node: ReactNode = null`

    expect(
      await runTransform({ filename: 'input.tsx', source, transform: migrateFieldComponentTypes }),
    ).toBe(
      `import type { ReactNode } from 'react'
import type { SelectFieldClientProps } from 'payload'
import type React from 'react'

const Field: React.FC<SelectFieldClientProps> = () => null
const node: ReactNode = null`,
    )
  })

  it('should produce valid TypeScript when React already has named type imports', async () => {
    const source = `import type { ReactNode } from 'react'
import type { SelectFieldClientComponent } from 'payload'

const Field: SelectFieldClientComponent = () => null
const node: ReactNode = null`
    const output = await runTransform({
      filename: 'input.ts',
      source,
      transform: migrateFieldComponentTypes,
    })
    const project = new Project({
      compilerOptions: { esModuleInterop: true, noEmit: true, strict: true },
      useInMemoryFileSystem: true,
    })

    project.createSourceFile(
      '/node_modules/react/index.d.ts',
      `declare namespace React { type FC<Props> = (props: Props) => unknown; type ReactNode = unknown }
export = React`,
    )
    project.createSourceFile(
      '/node_modules/payload/index.d.ts',
      `export type SelectFieldClientProps = Record<string, unknown>`,
    )
    project.createSourceFile('/output.ts', output)

    expect(
      project.getPreEmitDiagnostics().map((diagnostic) => diagnostic.getMessageText()),
    ).toEqual([])
  })

  it('should insert a valid React import when statements share a line', async () => {
    const source = `import type { TextFieldClientComponent } from 'payload'; const Field: TextFieldClientComponent = () => null;`
    const output = await runTransform({
      filename: 'input.ts',
      source,
      transform: migrateFieldComponentTypes,
    })
    const project = new Project({
      compilerOptions: { esModuleInterop: true, noEmit: true, strict: true },
      useInMemoryFileSystem: true,
    })

    project.createSourceFile(
      '/node_modules/react/index.d.ts',
      `declare namespace React { type FC<Props> = (props: Props) => unknown }
export = React`,
    )
    project.createSourceFile(
      '/node_modules/payload/index.d.ts',
      `export type TextFieldClientProps = Record<string, unknown>`,
    )
    project.createSourceFile('/output.ts', output)

    expect(output).toContain(`import type React from 'react'`)
    expect(
      project.getPreEmitDiagnostics().map((diagnostic) => diagnostic.getMessageText()),
    ).toEqual([])
  })

  it('should insert React imports after all leading directives and existing imports', async () => {
    const source = `'use strict'
'use client'

import type { TextFieldClientComponent } from 'payload'

const Field: TextFieldClientComponent = () => null`

    expect(
      await runTransform({ filename: 'input.tsx', source, transform: migrateFieldComponentTypes }),
    ).toBe(`'use strict'
'use client'

import type { TextFieldClientProps } from 'payload'
import type React from 'react'

const Field: React.FC<TextFieldClientProps> = () => null`)
  })

  it('should avoid local React and props-name collisions', async () => {
    const source = `import type { TextFieldClientComponent } from 'payload'

type TextFieldClientProps = { custom: true }
const React = 'local'
const Field: TextFieldClientComponent = () => null`

    expect(
      await runTransform({ filename: 'input.tsx', source, transform: migrateFieldComponentTypes }),
    ).toBe(
      `import type { TextFieldClientProps as TextFieldClientPropsType } from 'payload'
import type ReactType from 'react'

type TextFieldClientProps = { custom: true }
const React = 'local'
const Field: ReactType.FC<TextFieldClientPropsType> = () => null`,
    )
  })

  it('should avoid local generic-default type collisions', async () => {
    const source = `import type { FieldDiffServerComponent } from 'payload'

type Field = { custom: 'server' }
type ClientFieldWithOptionalType = { custom: 'client' }
const Diff: FieldDiffServerComponent = () => null`

    expect(
      await runTransform({ filename: 'input.tsx', source, transform: migrateFieldComponentTypes }),
    ).toBe(
      `import type { FieldDiffServerProps, Field as FieldType, ClientFieldWithOptionalType as ClientFieldWithOptionalTypeType } from 'payload'
import type React from 'react'

type Field = { custom: 'server' }
type ClientFieldWithOptionalType = { custom: 'client' }
const Diff: React.FC<FieldDiffServerProps<FieldType, ClientFieldWithOptionalTypeType>> = () => null`,
    )
  })

  it('should avoid nested scopes that shadow existing React and props imports', async () => {
    const source = `import React from 'react'
import type { TextFieldClientComponent, TextFieldClientProps } from 'payload'

function wrap<TextFieldClientProps, React>() {
  const Field: TextFieldClientComponent = () => null
  return Field
}`

    expect(
      await runTransform({ filename: 'input.tsx', source, transform: migrateFieldComponentTypes }),
    ).toBe(
      `import React from 'react'
import type { TextFieldClientProps as TextFieldClientPropsType, TextFieldClientProps } from 'payload'
import type ReactType from 'react'

function wrap<TextFieldClientProps, React>() {
  const Field: ReactType.FC<TextFieldClientPropsType> = () => null
  return Field
}`,
    )
  })

  it('should leave explicit class components unchanged and report manual work', async () => {
    const source = `import React from 'react'
import type { TextFieldClientComponent } from 'payload'

const Field: TextFieldClientComponent = class extends React.Component {}`
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/class-component.tsx', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([expect.stringContaining('/class-component.tsx:4')])
    expect(result.notes?.[0]).toContain('class component')
  })

  it('should leave parenthesized class components unchanged and report manual work', async () => {
    const source = `import React from 'react'
import type { TextFieldClientComponent } from 'payload'

const Field: TextFieldClientComponent = (class extends React.Component {})`
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/parenthesized-class-component.tsx', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.join('\n')).toContain('class component')
  })

  it('should leave referenced class components unchanged and report manual work', async () => {
    const source = `import React from 'react'
import type { TextFieldClientComponent } from 'payload'

class CustomField extends React.Component {}
const Field: TextFieldClientComponent = CustomField`
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/referenced-class-component.tsx', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.join('\n')).toContain('class component')
  })

  it('should leave referenced class expressions unchanged and report manual work', async () => {
    const source = `import React from 'react'
import type { TextFieldClientComponent } from 'payload'

const CustomField = class extends React.Component {}
const Field: TextFieldClientComponent = CustomField`
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/referenced-class-expression.tsx', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.join('\n')).toContain('class component')
  })

  it('should leave class components in arrays unchanged and report manual work', async () => {
    const source = `import React from 'react'
import type { TextFieldClientComponent } from 'payload'

class CustomField extends React.Component {}
const fields: TextFieldClientComponent[] = [CustomField]`
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/array-class-component.tsx', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.join('\n')).toContain('/array-class-component.tsx')
    expect(result.notes?.join('\n')).toContain('class component')
  })

  it('should leave class components in conditional array values unchanged', async () => {
    const source = `import React from 'react'
import type { TextFieldClientComponent } from 'payload'

class CustomField extends React.Component {}
const isCustomFieldEnabled = true
const fields: TextFieldClientComponent[] = [
  isCustomFieldEnabled ? CustomField : () => null,
]`
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/conditional-class-component.tsx', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.join('\n')).toContain('class component')
  })

  it('should leave class components in object properties unchanged and report manual work', async () => {
    const source = `import React from 'react'
import type { TextFieldClientComponent } from 'payload'

class CustomField extends React.Component {}
const fields: { field: TextFieldClientComponent } = { field: CustomField }`
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/object-class-component.tsx', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.join('\n')).toContain('/object-class-component.tsx')
    expect(result.notes?.join('\n')).toContain('class component')
  })

  it('should migrate object properties when an unrelated property contains a class', async () => {
    const source = `import type { TextFieldClientComponent } from 'payload'

class Helper {}
const fields: { field: TextFieldClientComponent; helper: typeof Helper } = {
  field: () => null,
  helper: Helper,
}`

    expect(
      await runTransform({ filename: 'input.tsx', source, transform: migrateFieldComponentTypes }),
    ).toBe(`import type { TextFieldClientProps } from 'payload'
import type React from 'react'

class Helper {}
const fields: { field: React.FC<TextFieldClientProps>; helper: typeof Helper } = {
  field: () => null,
  helper: Helper,
}`)
  })

  it('should leave class components in referenced containers unchanged and report manual work', async () => {
    const source = `import React from 'react'
import type { TextFieldClientComponent } from 'payload'

class CustomField extends React.Component {}
const customFields = [CustomField]
const fields: TextFieldClientComponent[] = customFields`
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/referenced-container-class-component.tsx', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.join('\n')).toContain('/referenced-container-class-component.tsx')
    expect(result.notes?.join('\n')).toContain('class component')
  })

  it('should leave generic class components unchanged and report manual work', async () => {
    const source = `import React from 'react'
import type { FieldErrorClientComponent, TextFieldClient } from 'payload'

const Field: FieldErrorClientComponent<TextFieldClient> = class extends React.Component {}`
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/generic-class-component.tsx', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([expect.stringContaining('/generic-class-component.tsx:4')])
    expect(result.notes?.[0]).toContain('class component')
  })

  it.each([
    `export type { TextFieldClientComponent } from 'payload'`,
    `import type * as Payload from 'payload'\ntype Field = Payload.TextFieldClientComponent`,
    `type Field = import('payload').TextFieldClientComponent`,
    `type Field = import( 'payload' ).TextFieldClientComponent`,
    `type Field = import(/* webpackIgnore: true */ 'payload').TextFieldClientComponent`,
    `import type { TextFieldClientComponent } from 'payload'\nexport type { TextFieldClientComponent }`,
  ])('should warn about unsupported import forms without changing source', async (source) => {
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/unsupported.ts', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.join('\n')).toContain('/unsupported.ts')
  })

  it('should not change unrelated code', async () => {
    const source = `import type { TextFieldClientProps } from 'payload'
const value: TextFieldClientProps | undefined = undefined`

    expect(await runTransform({ source, transform: migrateFieldComponentTypes })).toBe(source)
  })

  it('should preserve unrelated side-effect imports', async () => {
    const source = `import 'payload'\nconst value = true`
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/side-effect.ts', source)

    const result = await migrateFieldComponentTypes.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
  })

  it('should remove an unused removed component type', async () => {
    const source = `import type { TextFieldClientComponent, TextFieldClientProps } from 'payload'
const value: TextFieldClientProps | undefined = undefined`

    expect(await runTransform({ source, transform: migrateFieldComponentTypes })).toBe(
      `import type { TextFieldClientProps } from 'payload'
const value: TextFieldClientProps | undefined = undefined`,
    )
  })

  it('should register the transform', () => {
    expect(transforms).toContain(migrateFieldComponentTypes)
  })
})
