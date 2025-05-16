import { jest } from '@jest/globals'
import { lexicalTargetVersion } from './index'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs/promises'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Lexical dependency checker', () => {
  it('ensure lexical version installed in package.json matches dependency checker version', async () => {
    const packageJsonString = await fs.readFile(path.resolve(dirname, '../package.json'), 'utf-8')
    const packageJson = JSON.parse(packageJsonString)
    const packageJsonLexicalVersion = packageJson.dependencies['lexical']

    expect(packageJsonLexicalVersion).toBe(lexicalTargetVersion)
  })
})
