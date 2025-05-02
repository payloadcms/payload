import { readFileSync } from 'fs'
import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const packageJson = JSON.parse(readFileSync(path.resolve(dirname, '../../package.json'), 'utf-8'))
export const PACKAGE_VERSION = packageJson.version
