import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const { bin } = await import(path.resolve(dirname, '../../packages/payload/src/bin/index.js'))

await bin()
