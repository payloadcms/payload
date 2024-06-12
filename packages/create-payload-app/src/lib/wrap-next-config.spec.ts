import { parseAndModifyConfigContent, withPayloadStatement } from './wrap-next-config.js'
import * as p from '@clack/prompts'
import { jest } from '@jest/globals'

const esmConfigs = {
  defaultNextConfig: `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
`,
  nextConfigWithFunc: `const nextConfig = {};
export default someFunc(nextConfig);
`,
  nextConfigWithFuncMultiline: `const nextConfig = {};;
export default someFunc(
  nextConfig
);
`,
  nextConfigExportNamedDefault: `const nextConfig = {};
const wrapped = someFunc(asdf);
export { wrapped as default };
`,
  nextConfigWithSpread: `const nextConfig = {
  ...someConfig,
};
export default nextConfig;
`,
}

const cjsConfigs = {
  defaultNextConfig: `
  /** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
`,
  anonConfig: `module.exports = {};`,
  nextConfigWithFunc: `const nextConfig = {};
module.exports = someFunc(nextConfig);
`,
  nextConfigWithFuncMultiline: `const nextConfig = {};
module.exports = someFunc(
  nextConfig
);
`,
  nextConfigExportNamedDefault: `const nextConfig = {};
const wrapped = someFunc(asdf);
module.exports = wrapped;
`,
  nextConfigWithSpread: `const nextConfig = { ...someConfig };
module.exports = nextConfig;
`,
}

describe('parseAndInsertWithPayload', () => {
  describe('esm', () => {
    const configType = 'esm'
    const importStatement = withPayloadStatement[configType]
    it('should parse the default next config', () => {
      const { modifiedConfigContent } = parseAndModifyConfigContent(
        esmConfigs.defaultNextConfig,
        configType,
      )
      expect(modifiedConfigContent).toContain(importStatement)
      expect(modifiedConfigContent).toContain('withPayload(nextConfig)')
    })
    it('should parse the config with a function', () => {
      const { modifiedConfigContent } = parseAndModifyConfigContent(
        esmConfigs.nextConfigWithFunc,
        configType,
      )
      expect(modifiedConfigContent).toContain('withPayload(someFunc(nextConfig))')
    })

    it('should parse the config with a function on a new line', () => {
      const { modifiedConfigContent } = parseAndModifyConfigContent(
        esmConfigs.nextConfigWithFuncMultiline,
        configType,
      )
      expect(modifiedConfigContent).toContain(importStatement)
      expect(modifiedConfigContent).toMatch(/withPayload\(someFunc\(\n  nextConfig\n\)\)/)
    })

    it('should parse the config with a spread', () => {
      const { modifiedConfigContent } = parseAndModifyConfigContent(
        esmConfigs.nextConfigWithSpread,
        configType,
      )
      expect(modifiedConfigContent).toContain(importStatement)
      expect(modifiedConfigContent).toContain('withPayload(nextConfig)')
    })

    // Unsupported: export { wrapped as default }
    it('should give warning with a named export as default', () => {
      const warnLogSpy = jest.spyOn(p.log, 'warn').mockImplementation(() => {})

      const { modifiedConfigContent, success } = parseAndModifyConfigContent(
        esmConfigs.nextConfigExportNamedDefault,
        configType,
      )
      expect(modifiedConfigContent).toContain(importStatement)
      expect(success).toBe(false)

      expect(warnLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not automatically wrap'),
      )
    })
  })

  describe('cjs', () => {
    const configType = 'cjs'
    const requireStatement = withPayloadStatement[configType]
    it('should parse the default next config', () => {
      const { modifiedConfigContent } = parseAndModifyConfigContent(
        cjsConfigs.defaultNextConfig,
        configType,
      )
      expect(modifiedConfigContent).toContain(requireStatement)
      expect(modifiedConfigContent).toContain('withPayload(nextConfig)')
    })
    it('should parse anonymous default config', () => {
      const { modifiedConfigContent } = parseAndModifyConfigContent(
        cjsConfigs.anonConfig,
        configType,
      )
      expect(modifiedConfigContent).toContain(requireStatement)
      expect(modifiedConfigContent).toContain('withPayload({})')
    })
    it('should parse the config with a function', () => {
      const { modifiedConfigContent } = parseAndModifyConfigContent(
        cjsConfigs.nextConfigWithFunc,
        configType,
      )
      expect(modifiedConfigContent).toContain('withPayload(someFunc(nextConfig))')
    })
    it('should parse the config with a function on a new line', () => {
      const { modifiedConfigContent } = parseAndModifyConfigContent(
        cjsConfigs.nextConfigWithFuncMultiline,
        configType,
      )
      expect(modifiedConfigContent).toContain(requireStatement)
      expect(modifiedConfigContent).toMatch(/withPayload\(someFunc\(\n  nextConfig\n\)\)/)
    })
    it('should parse the config with a named export as default', () => {
      const { modifiedConfigContent } = parseAndModifyConfigContent(
        cjsConfigs.nextConfigExportNamedDefault,
        configType,
      )
      expect(modifiedConfigContent).toContain(requireStatement)
      expect(modifiedConfigContent).toContain('withPayload(wrapped)')
    })

    it('should parse the config with a spread', () => {
      const { modifiedConfigContent } = parseAndModifyConfigContent(
        cjsConfigs.nextConfigWithSpread,
        configType,
      )
      expect(modifiedConfigContent).toContain(requireStatement)
      expect(modifiedConfigContent).toContain('withPayload(nextConfig)')
    })
  })
})
