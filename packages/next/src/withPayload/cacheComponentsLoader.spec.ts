import { describe, expect, it } from 'vitest'

import loader from './cacheComponentsLoader.cjs'

function transform({
  file = '/app/(payload)/layout.tsx',
  source,
}: {
  file?: string
  source: string
}) {
  let result = ''
  const sourceMap = { mappings: '' }

  loader.call(
    {
      callback: (error: Error | null, output: string, outputMap: unknown) => {
        if (error) {
          throw error
        }
        expect(outputMap).toBe(sourceMap)
        result = output
      },
      resourcePath: file,
    },
    source,
    sourceMap,
  )

  return result
}

describe('Cache Components admin route loader', () => {
  it.each([
    {
      file: '/src/app/(cms)/layout.tsx',
      source:
        "import { RootLayout as Layout } from '@payloadcms/next/layouts'\nexport default () => <Layout />",
    },
    {
      file: '/src/app/manage/[[...parts]]/page.tsx',
      source: "import { RootPage } from '@payloadcms/next/views'\nexport default RootPage",
    },
  ])(
    'should opt the admin entry out without depending on its route path: $file',
    ({ file, source }) => {
      const result = transform({ file, source })

      expect(result).toMatch(/as instant/)
      expect(result).toContain('= false')
      expect(result.startsWith(source)).toBe(true)
    },
  )

  it.each([
    "// import { RootLayout } from '@payloadcms/next/layouts'\nexport default () => null",
    "import type { RootLayout } from '@payloadcms/next/layouts'\nexport default () => null",
    "import { type RootLayout } from '@payloadcms/next/layouts'\nexport default () => null",
    "import { generatePayloadViewport } from '@payloadcms/next/layouts'\nexport default () => null",
    "import * as payload from '@payloadcms/next/layouts'\nexport const generateViewport = payload.generatePayloadViewport",
    'export default () => <main>Frontend</main>',
  ])('should leave unrelated routes unchanged', (source) => {
    expect(transform({ source })).toBe(source)
  })

  it.each([
    'export const instant = true',
    'const config = false; export { config as instant }',
    "export { instant } from './config'",
    'export const { instant } = { instant: true }',
  ])('should preserve an explicit route opt-in or opt-out', (declaration) => {
    const source = `import { RootLayout } from '@payloadcms/next/layouts'\n${declaration}`

    expect(transform({ source })).toBe(source)
  })

  it('should avoid collisions with existing variables and remain idempotent', () => {
    const source =
      "import { RootLayout } from '@payloadcms/next/layouts'\nconst instant = true; const __payloadInstant = true"
    const result = transform({ source })

    expect(result).toContain('const __payloadInstant_ = false')
    expect(transform({ source: result })).toBe(result)
  })

  it('should accept TypeScript assertions in routes without JSX', () => {
    const result = transform({
      file: '/app/layout.ts',
      source:
        "import { RootLayout } from '@payloadcms/next/layouts'\nconst value = <string>'value'",
    })

    expect(result).toContain('as instant')
  })
})
