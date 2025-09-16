import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { addPluginsToConfig } from './add-plugins-to-config.js'
import { pluginReplacements } from './ast-replacements.js'

describe('populateConfigWithPlugins', () => {
  it('should populate the config with plugins', async () => {
    const configPath = path.resolve(dirname, '../../../../templates/blank/src/payload.config.ts')
    const { configContent } = await addPluginsToConfig({
      configPath,
      plugins: ['@payloadcms/plugin-search'],
      saveConfig: false,
    })

    const plugin = pluginReplacements['@payloadcms/plugin-search']

    expect(configContent).toContain(`import { ${plugin.importName} } from '${plugin.importModule}'`)
    expect(configContent).toMatch(/plugins:\s\[.*searchPlugin\(\).*\]/s)
  })
})
