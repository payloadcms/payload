import * as p from '@clack/prompts'
import { jest } from '@jest/globals'

import { parseAndModifyConfigContent, withPayloadStatement } from './wrap-next-config.js'

const tsConfigs = {
  defaultNextConfig: `import type { NextConfig } from "next";

const nextConfig: NextConfig = {};
export default nextConfig;`,

  nextConfigExportNamedDefault: `import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
const wrapped = someFunc(asdf);
export { wrapped as default };
`,
  nextConfigWithFunc: `import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default someFunc(nextConfig);
`,
  nextConfigWithFuncMultiline: `import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default someFunc(
  nextConfig
);
`,
  nextConfigWithSpread: `import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  ...someConfig,
};
export default nextConfig;
`,
}

const esmConfigs = {
  defaultNextConfig: `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
`,
  nextConfigExportNamedDefault: `const nextConfig = {};
const wrapped = someFunc(asdf);
export { wrapped as default };
`,
  nextConfigWithFunc: `const nextConfig = {};
export default someFunc(nextConfig);
`,
  nextConfigWithFuncMultiline: `const nextConfig = {};;
export default someFunc(
  nextConfig
);
`,
  nextConfigWithSpread: `const nextConfig = {
  ...someConfig,
};
export default nextConfig;
`,
}

const cjsConfigs = {
  anonConfig: `module.exports = {};`,
  defaultNextConfig: `
  /** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
`,
  nextConfigExportNamedDefault: `const nextConfig = {};
const wrapped = someFunc(asdf);
module.exports = wrapped;
`,
  nextConfigWithFunc: `const nextConfig = {};
module.exports = someFunc(nextConfig);
`,
  nextConfigWithFuncMultiline: `const nextConfig = {};
module.exports = someFunc(
  nextConfig
);
`,
  nextConfigWithSpread: `const nextConfig = { ...someConfig };
module.exports = nextConfig;
`,
}

describe('parseAndInsertWithPayload', () => {
  describe('ts', () => {
    const configType = 'ts'
    const importStatement = withPayloadStatement[configType]

    it('should parse the default next config', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        tsConfigs.defaultNextConfig,
        configType,
      )
      expect(modifiedConfigContent).toContain(importStatement)
      expect(modifiedConfigContent).toContain('withPayload(nextConfig)')
    })

    it('should parse the config with a function', async () => {
      const { modifiedConfigContent: modifiedConfigContent2 } = await parseAndModifyConfigContent(
        tsConfigs.nextConfigWithFunc,
        configType,
      )
      expect(modifiedConfigContent2).toContain('withPayload(someFunc(nextConfig))')
    })

    it('should parse the config with a multi-lined function', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        tsConfigs.nextConfigWithFuncMultiline,
        configType,
      )
      expect(modifiedConfigContent).toContain(importStatement)
      expect(modifiedConfigContent).toMatch(/withPayload\(someFunc\(\n {2}nextConfig\n\)\)/)
    })

    it('should parse the config with a spread', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        tsConfigs.nextConfigWithSpread,
        configType,
      )
      expect(modifiedConfigContent).toContain(importStatement)
      expect(modifiedConfigContent).toContain('withPayload(nextConfig)')
    })
  })
  describe('esm', () => {
    const configType = 'esm'
    const importStatement = withPayloadStatement[configType]
    it('should parse the default next config', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        esmConfigs.defaultNextConfig,
        configType,
      )
      expect(modifiedConfigContent).toContain(importStatement)
      expect(modifiedConfigContent).toContain('withPayload(nextConfig)')
    })
    it('should parse the config with a function', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        esmConfigs.nextConfigWithFunc,
        configType,
      )
      expect(modifiedConfigContent).toContain('withPayload(someFunc(nextConfig))')
    })

    it('should parse the config with a multi-lined function', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        esmConfigs.nextConfigWithFuncMultiline,
        configType,
      )
      expect(modifiedConfigContent).toContain(importStatement)
      expect(modifiedConfigContent).toMatch(/withPayload\(someFunc\(\n {2}nextConfig\n\)\)/)
    })

    it('should parse the config with a spread', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        esmConfigs.nextConfigWithSpread,
        configType,
      )
      expect(modifiedConfigContent).toContain(importStatement)
      expect(modifiedConfigContent).toContain('withPayload(nextConfig)')
    })

    // Unsupported: export { wrapped as default }
    it('should give warning with a named export as default', async () => {
      const warnLogSpy = jest.spyOn(p.log, 'warn').mockImplementation(() => {})

      const { modifiedConfigContent, success } = await parseAndModifyConfigContent(
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
    it('should parse the default next config', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        cjsConfigs.defaultNextConfig,
        configType,
      )
      expect(modifiedConfigContent).toContain(requireStatement)
      expect(modifiedConfigContent).toContain('withPayload(nextConfig)')
    })
    it('should parse anonymous default config', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        cjsConfigs.anonConfig,
        configType,
      )
      expect(modifiedConfigContent).toContain(requireStatement)
      expect(modifiedConfigContent).toContain('withPayload({})')
    })
    it('should parse the config with a function', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        cjsConfigs.nextConfigWithFunc,
        configType,
      )
      expect(modifiedConfigContent).toContain('withPayload(someFunc(nextConfig))')
    })
    it('should parse the config with a multi-lined function', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        cjsConfigs.nextConfigWithFuncMultiline,
        configType,
      )
      expect(modifiedConfigContent).toContain(requireStatement)
      expect(modifiedConfigContent).toMatch(/withPayload\(someFunc\(\n {2}nextConfig\n\)\)/)
    })
    it('should parse the config with a named export as default', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        cjsConfigs.nextConfigExportNamedDefault,
        configType,
      )
      expect(modifiedConfigContent).toContain(requireStatement)
      expect(modifiedConfigContent).toContain('withPayload(wrapped)')
    })

    it('should parse the config with a spread', async () => {
      const { modifiedConfigContent } = await parseAndModifyConfigContent(
        cjsConfigs.nextConfigWithSpread,
        configType,
      )
      expect(modifiedConfigContent).toContain(requireStatement)
      expect(modifiedConfigContent).toContain('withPayload(nextConfig)')
    })
  })
})
