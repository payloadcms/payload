import { parse } from 'comment-json'
import fse from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { configurePayloadTsConfig } from './configure-payload-tsconfig.js'

describe('configurePayloadTsConfig', () => {
  let configPath: string
  let payloadConfigPath: string
  let projectDir: string

  beforeEach(() => {
    projectDir = fse.mkdtempSync(path.join(os.tmpdir(), 'cpa-payload-tsconfig-'))
    configPath = path.join(projectDir, 'tsconfig.json')
    payloadConfigPath = path.join(projectDir, 'src/payload.config.ts')
  })

  afterEach(() => {
    fse.removeSync(projectDir)
  })

  it('should add the Payload alias without changing existing paths', async () => {
    writeTsConfig(`{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`)

    await configurePayloadTsConfig({ configPath, payloadConfigPath })

    expect(readTsConfig().compilerOptions.paths).toEqual({
      '@/*': ['./src/*'],
      '@payload-config': ['./src/payload.config.ts'],
    })
  })

  it('should create paths when compiler options do not define them', async () => {
    writeTsConfig(`{
  "compilerOptions": {
    "strict": true
  }
}`)

    await configurePayloadTsConfig({ configPath, payloadConfigPath })

    expect(readTsConfig().compilerOptions).toEqual({
      paths: {
        '@payload-config': ['./src/payload.config.ts'],
      },
      strict: true,
    })
  })

  it('should preserve comments while adding the Payload alias', async () => {
    writeTsConfig(`{
  // Keep this compiler explanation.
  "compilerOptions": {
    "paths": {
      // Keep this application alias.
      "@/*": ["./src/*"]
    }
  }
}`)

    await configurePayloadTsConfig({ configPath, payloadConfigPath })

    const content = fse.readFileSync(configPath, 'utf8')

    expect(content).toContain('// Keep this compiler explanation.')
    expect(content).toContain('// Keep this application alias.')
    expect(readTsConfig().compilerOptions.paths['@payload-config']).toEqual([
      './src/payload.config.ts',
    ])
  })

  it('should resolve the Payload alias relative to a non-default baseUrl', async () => {
    writeTsConfig(`{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {}
  }
}`)

    await configurePayloadTsConfig({ configPath, payloadConfigPath })

    expect(readTsConfig().compilerOptions.paths['@payload-config']).toEqual(['./payload.config.ts'])
  })

  it('should leave an existing Payload alias unchanged', async () => {
    const original = `{
  "compilerOptions": {
    "paths": {
      "@payload-config": ["./custom/payload.ts"]
    }
  }
}`
    writeTsConfig(original)

    await configurePayloadTsConfig({ configPath, payloadConfigPath })

    expect(fse.readFileSync(configPath, 'utf8')).toBe(original)
  })

  it('should be idempotent after adding the Payload alias', async () => {
    writeTsConfig(`{
  "compilerOptions": {
    "paths": {}
  }
}`)

    await configurePayloadTsConfig({ configPath, payloadConfigPath })
    const firstResult = fse.readFileSync(configPath, 'utf8')

    await configurePayloadTsConfig({ configPath, payloadConfigPath })

    expect(fse.readFileSync(configPath, 'utf8')).toBe(firstResult)
  })

  function readTsConfig(): {
    compilerOptions: {
      baseUrl?: string
      paths: Record<string, string[]>
      strict?: boolean
    }
  } {
    return parse(fse.readFileSync(configPath, 'utf8')) as {
      compilerOptions: {
        baseUrl?: string
        paths: Record<string, string[]>
        strict?: boolean
      }
    }
  }

  function writeTsConfig(content: string): void {
    fse.writeFileSync(configPath, content)
  }
})
