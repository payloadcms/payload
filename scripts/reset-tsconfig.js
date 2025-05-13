// @ts-check

/**
 * Parse tsconfig.json and ensure
 * - compilerOptions.paths['@payload-config'] is set to ['./test/_community/config.ts']
 * - Ends with a newline
 */

import { parse, stringify } from 'comment-json'

import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const tsConfigBasePath = path.resolve(dirname, '../tsconfig.base.json')
const tsConfigPath = existsSync(tsConfigBasePath)
  ? tsConfigBasePath
  : path.resolve(dirname, '../tsconfig.json')


const tsConfigContent = await fs.readFile(tsConfigPath, 'utf8')
const tsConfig = parse(tsConfigContent)

tsConfig.compilerOptions.paths['@payload-config'] = ['./test/_community/config.ts']
const output = stringify(tsConfig, null, 2) + `\n`
await fs.writeFile(tsConfigPath, output)
