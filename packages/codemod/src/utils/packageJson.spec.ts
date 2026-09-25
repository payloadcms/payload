import { describe, expect, it } from 'vitest'

import type { Transform } from '../types.js'

import { serializePackageJson } from './packageJson.js'
import { runTransformOnPackageJson } from './test-helpers.js'

describe('serializePackageJson', () => {
  it('preserves two-space indentation, key order, and trailing newline', () => {
    const original = '{\n  "name": "x",\n  "scripts": {\n    "build": "next build"\n  }\n}\n'
    const data = JSON.parse(original)

    expect(serializePackageJson(data, original)).toBe(original)
  })

  it('omits trailing newline when the original had none', () => {
    const original = '{\n  "name": "x"\n}'
    const data = JSON.parse(original)

    expect(serializePackageJson(data, original)).toBe(original)
  })
})

describe('runTransforms threading', () => {
  const setName: Transform = {
    name: 'set-name',
    apply: ({ packageJsons }) => {
      const changed: string[] = []
      for (const pkg of packageJsons) {
        pkg.data.name = 'renamed'
        changed.push(pkg.path)
      }
      return { filesChanged: changed }
    },
    description: 'test transform',
  }

  it('passes packageJsons to the transform and reflects mutations', async () => {
    const input = '{\n  "name": "old"\n}\n'

    const result = await runTransformOnPackageJson({ source: input, transform: setName })

    expect(result).toBe('{\n  "name": "renamed"\n}\n')
  })
})
