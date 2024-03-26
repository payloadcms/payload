import { parseAndInsertWithPayload, withPayloadImportStatement } from './wrap-next-config'

const defaultNextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
`

const nextConfigWithFunc = `const nextConfig = {
  // Your Next.js config here
}

export default someFunc(nextConfig)
`
const nextConfigWithFuncMultiline = `const nextConfig = {
  // Your Next.js config here
}

export default someFunc(
  nextConfig
)
`

const nextConfigExportNamedDefault = `const nextConfig = {
  // Your Next.js config here
}
const wrapped = someFunc(asdf)
export { wrapped as default }
`

describe('parseAndInsertWithPayload', () => {
  it('should parse the default next config', () => {
    const { modifiedConfigContent } = parseAndInsertWithPayload(defaultNextConfig)
    expect(modifiedConfigContent).toContain(withPayloadImportStatement)
    expect(modifiedConfigContent).toContain('withPayload(nextConfig)')
  })
  it('should parse the config with a function', () => {
    const { modifiedConfigContent } = parseAndInsertWithPayload(nextConfigWithFunc)
    expect(modifiedConfigContent).toContain('withPayload(someFunc(nextConfig))')
  })

  it('should parse the config with a function on a new line', () => {
    const { modifiedConfigContent } = parseAndInsertWithPayload(nextConfigWithFuncMultiline)
    expect(modifiedConfigContent).toContain(withPayloadImportStatement)
    expect(modifiedConfigContent).toMatch(/withPayload\(someFunc\(\n  nextConfig\n\)\)/)
  })

  // Unsupported: export { wrapped as default }
  it('should give warning with a named export as default', () => {
    const { modifiedConfigContent, error } = parseAndInsertWithPayload(nextConfigExportNamedDefault)
    expect(modifiedConfigContent).toContain(withPayloadImportStatement)
    expect(error).toBeTruthy()
  })
})
