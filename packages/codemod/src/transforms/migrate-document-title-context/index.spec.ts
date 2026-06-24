import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateDocumentTitleContext } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-document-title-context', () => {
  it('migrates title and setDocumentTitle to useDocumentTitle()', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: migrateDocumentTitleContext })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: migrateDocumentTitleContext })

    expect(result).toBe(output)
  })

  it('no-ops on unrelated code', async () => {
    const input = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')

    const result = await runTransform({ source: input, transform: migrateDocumentTitleContext })

    expect(result).toBe(output)
  })

  it('removes useDocumentInfo import when no other properties are used', async () => {
    const input = `import { useDocumentInfo } from '@payloadcms/ui'

export const C = () => {
  const { title, setDocumentTitle } = useDocumentInfo()
  return { title, setDocumentTitle }
}
`

    const result = await runTransform({
      source: input,
      transform: migrateDocumentTitleContext,
    })

    expect(result).not.toContain('useDocumentInfo')
    expect(result).toContain("import { useDocumentTitle } from '@payloadcms/ui'")
    expect(result).toContain('const { title, setDocumentTitle } = useDocumentTitle()')
  })

  it('reuses an existing @payloadcms/ui import for useDocumentTitle', async () => {
    const input = `import { useDocumentInfo, useTranslation } from '@payloadcms/ui'

export const C = () => {
  const { id, title } = useDocumentInfo()
  useTranslation()
  return { id, title }
}
`

    const result = await runTransform({
      source: input,
      transform: migrateDocumentTitleContext,
    })

    const importMatches = result.match(/from '@payloadcms\/ui'/g) ?? []
    expect(importMatches.length).toBe(1)
    expect(result).toContain('useDocumentTitle')
    expect(result).toContain('useDocumentInfo')
  })

  it('skips destructure with default value and emits a note', async () => {
    const input = `import { useDocumentInfo } from '@payloadcms/ui'

export const C = () => {
  const { title = 'fallback' } = useDocumentInfo()
  return title
}
`

    const result = await runTransform({
      source: input,
      transform: migrateDocumentTitleContext,
    })

    expect(result).toBe(input)
  })
})
