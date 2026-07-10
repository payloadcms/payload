// @ts-check

/**
 * Reset @payload-config path in tsconfig.json back to the default community config.
 * Used as a lint-staged hook to prevent committing modified paths.
 */

import { fileURLToPath } from 'url'
import path from 'path'

import { replacePayloadConfigPath } from './replacePayloadConfigPath.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const rootDir = path.resolve(dirname, '..')

await replacePayloadConfigPath(rootDir, './test/_community/config.ts')
