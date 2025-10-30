import { jest } from '@jest/globals'
import { lexicalTargetVersion } from './index'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs/promises'
import yaml from 'js-yaml'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Lexical dependency checker', () => {
  it('ensure lexical version in pnpm catalog matches dependency checker version', async () => {
    // Read pnpm-workspace.yaml from the root of the monorepo
    const workspaceYamlPath = path.resolve(dirname, '../../../pnpm-workspace.yaml')
    const workspaceYamlContent = await fs.readFile(workspaceYamlPath, 'utf-8')

    // Parse the YAML content
    const workspaceConfig = yaml.load(workspaceYamlContent) as {
      catalog?: Record<string, string>
    }

    if (!workspaceConfig.catalog) {
      throw new Error('Could not find catalog section in pnpm-workspace.yaml')
    }

    const catalogLexicalVersion = workspaceConfig.catalog['lexical']
    if (!catalogLexicalVersion) {
      throw new Error('Could not find lexical version in catalog')
    }

    expect(catalogLexicalVersion).toBe(lexicalTargetVersion)
  })
})
