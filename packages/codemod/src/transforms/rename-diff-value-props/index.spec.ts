import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { renameDiffValueProps } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

const applyToProject = async ({ files }: { files: Record<string, string> }) => {
  const project = new Project({ useInMemoryFileSystem: true })

  for (const [path, source] of Object.entries(files)) {
    project.createSourceFile(path, source)
  }

  const result = await renameDiffValueProps.apply({ packageJsons: [], project })
  const textOf = (path: string) => project.getSourceFileOrThrow(path).getFullText()

  return { result, textOf }
}

describe('rename-diff-value-props', () => {
  it('renames comparisonValue and versionValue in Diff components', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: renameDiffValueProps })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: renameDiffValueProps })

    expect(result).toBe(output)
  })

  it('no-ops on code without Diff component types', async () => {
    const input = await fixture('no-match.input.ts')

    const { result, textOf } = await applyToProject({ files: { '/input.ts': input } })

    expect(textOf('/input.ts')).toBe(input)
    expect(result).toEqual({ filesChanged: [] })
  })

  it('reports the changed file without notes when everything was migrated', async () => {
    const input = await fixture('basic.input.ts')

    const { result } = await applyToProject({ files: { '/input.ts': input } })

    expect(result).toEqual({ filesChanged: ['/input.ts'] })
  })

  it.each([
    ['v3', 'comparisonValue: unknown; versionValue: unknown'],
    ['v4', 'valueFrom: unknown; valueTo: unknown'],
  ])('renames only local code when %s payload types resolve', async (_version, valueProperties) => {
    const payloadTypes = `export type TextFieldDiffClientProps = { field: { name: string }; ${valueProperties} }\n`

    const { result, textOf } = await applyToProject({
      files: {
        '/input.ts': `import type { TextFieldDiffClientProps } from 'payload'

export const Diff = ({ comparisonValue, versionValue }: TextFieldDiffClientProps) =>
  comparisonValue === versionValue
`,
        '/node_modules/payload/index.d.ts': payloadTypes,
      },
    })

    expect(textOf('/input.ts')).toBe(`import type { TextFieldDiffClientProps } from 'payload'

export const Diff = ({ valueFrom, valueTo }: TextFieldDiffClientProps) =>
  valueFrom === valueTo
`)
    expect(textOf('/node_modules/payload/index.d.ts')).toBe(payloadTypes)
    expect(result.filesChanged).toEqual(['/input.ts'])
  })

  it('keeps the key of a shorthand object literal built from a renamed variable', async () => {
    const { result, textOf } = await applyToProject({
      files: {
        '/input.ts': `import type { TextFieldDiffClientProps } from 'payload'

export const Diff = ({ comparisonValue }: TextFieldDiffClientProps) => ({ comparisonValue })
`,
      },
    })

    expect(textOf('/input.ts')).toBe(`import type { TextFieldDiffClientProps } from 'payload'

export const Diff = ({ valueFrom }: TextFieldDiffClientProps) => ({ comparisonValue: valueFrom })
`)
    expect(result.notes).toEqual([expect.stringContaining('/input.ts:3: `comparisonValue`')])
  })

  it('notes old prop names passed on to other components', async () => {
    const { result, textOf } = await applyToProject({
      files: {
        '/input.tsx': `import type { TextFieldDiffClientProps } from 'payload'
import { OtherDiff } from './OtherDiff'

export const Diff = (props: TextFieldDiffClientProps) => (
  <OtherDiff versionValue={props.versionValue} />
)
`,
      },
    })

    expect(textOf('/input.tsx')).toContain('<OtherDiff versionValue={props.valueTo} />')
    expect(result.notes).toEqual([
      '/input.tsx:5: `versionValue` was not migrated. If it refers to a Diff component prop, rename it to `valueTo`.',
    ])
  })

  it('does not rename reads from a variable that shadows the props parameter', async () => {
    const input = `import type { TextFieldDiffClientProps } from 'payload'

export const Diff = (props: TextFieldDiffClientProps) =>
  [{ versionValue: 1 }].map((props) => props.versionValue).concat(props.versionValue)
`

    const { result, textOf } = await applyToProject({ files: { '/input.ts': input } })

    expect(textOf('/input.ts')).toBe(`import type { TextFieldDiffClientProps } from 'payload'

export const Diff = (props: TextFieldDiffClientProps) =>
  [{ versionValue: 1 }].map((props) => props.versionValue).concat(props.valueTo)
`)
    expect(result.notes).toEqual([expect.stringContaining('/input.ts:4: `versionValue`')])
  })

  it('follows aliased imports and interfaces extending Diff types', async () => {
    const { textOf } = await applyToProject({
      files: {
        '/input.ts': `import type { TextFieldDiffClientProps as DiffProps } from 'payload'

interface Props extends DiffProps {
  label: string
}

export const Diff = ({ comparisonValue, label }: Props) => [comparisonValue, label]
`,
      },
    })

    expect(textOf('/input.ts')).toContain(
      'export const Diff = ({ valueFrom, label }: Props) => [valueFrom, label]',
    )
  })

  it('leaves functions that only receive Diff props nested in another object untouched', async () => {
    const input = `import type { TextFieldDiffClientProps } from 'payload'

export const render = ({ diff }: { diff: TextFieldDiffClientProps }) => diff

export const compare = ({ comparisonValue }: { comparisonValue: unknown }) => comparisonValue
`

    const { result, textOf } = await applyToProject({ files: { '/input.ts': input } })

    expect(textOf('/input.ts')).toBe(input)
    expect(result.filesChanged).toEqual([])
  })
})
