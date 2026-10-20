import { describe, expect, it } from 'vitest'

import instantLoader from './instantLoader.js'

describe('instantLoader', () => {
  it('should add instant = false to modules importing RootLayout', () => {
    const source = `import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'

const Layout = ({ children }) => <RootLayout config={config}>{children}</RootLayout>`

    expect(instantLoader(source)).toBe(`${source}\nexport const instant = false\n`)
  })

  it('should add instant = false to modules importing RootPage', () => {
    const source = `import {
  generatePageMetadata,
  RootPage,
} from "@payloadcms/next/views"

const Page = (args) => RootPage({ config, importMap, ...args })`

    expect(instantLoader(source)).toBe(`${source}\nexport const instant = false\n`)
  })

  it('should add instant = false when RootLayout is imported under an alias', () => {
    const source = `import { RootLayout as PayloadLayout } from '@payloadcms/next/layouts'

const Layout = ({ children }) => <PayloadLayout config={config}>{children}</PayloadLayout>`

    expect(instantLoader(source)).toBe(`${source}\nexport const instant = false\n`)
  })

  it('should not modify modules rendering a RootLayout that is not from Payload', () => {
    const source = `import { RootLayout } from '@/components/RootLayout'

const Layout = ({ children }) => <RootLayout>{children}</RootLayout>`

    expect(instantLoader(source)).toBe(source)
  })

  it('should not modify modules that only import NotFoundPage', () => {
    const source = `import { generatePageMetadata, NotFoundPage } from '@payloadcms/next/views'

const NotFound = (args) => NotFoundPage({ config, importMap, ...args })`

    expect(instantLoader(source)).toBe(source)
  })

  it('should not modify modules that already declare instant', () => {
    const source = `import { RootPage } from '@payloadcms/next/views'

export const instant = { level: 'warning' }

const Page = (args) => RootPage({ config, importMap, ...args })`

    expect(instantLoader(source)).toBe(source)
  })
})
