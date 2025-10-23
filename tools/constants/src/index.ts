import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Path to the project root
 */
export const PROJECT_ROOT = path.resolve(dirname, '../../../')
export const ROOT_PACKAGE_JSON = path.resolve(PROJECT_ROOT, 'package.json')
export const PACKAGES_DIR = path.resolve(PROJECT_ROOT, 'packages')
export const TEMPLATES_DIR = path.resolve(PROJECT_ROOT, 'templates')
