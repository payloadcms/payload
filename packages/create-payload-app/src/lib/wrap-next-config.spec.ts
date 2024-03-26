import { parseAndInsertWithPayload } from './wrap-next-config'

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

describe('parseAndInsertWithPayload', () => {
  it('should parse the default next config', () => {
    const modifiedConfig = parseAndInsertWithPayload(defaultNextConfig)
    expect(modifiedConfig).toMatch(/withPayload\(nextConfig\)/)
  })
  it('should parse the config with a function', () => {
    const modifiedConfig = parseAndInsertWithPayload(nextConfigWithFunc)
    expect(modifiedConfig).toMatch(/withPayload\(someFunc\(nextConfig\)\)/)
  })

  it('should parse the config with a function on a new line', () => {
    const modifiedConfig = parseAndInsertWithPayload(nextConfigWithFuncMultiline)
    expect(modifiedConfig).toMatch(/withPayload\(someFunc\(\n  nextConfig\n\)\)/)
  })
})
