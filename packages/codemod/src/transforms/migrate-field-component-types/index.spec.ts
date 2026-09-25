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

describe('migrate-field-component-types', () => {
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

  it.each([
    `export type { TextFieldClientComponent } from 'payload'`,
    `import type * as Payload from 'payload'\ntype Field = Payload.TextFieldClientComponent`,
    `type Field = import('payload').TextFieldClientComponent`,
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
