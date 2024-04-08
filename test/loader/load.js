import { register } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const load = async (filePath) => {
  const filename = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filename)
  const url = pathToFileURL(dirname).toString() + '/'

  // Need to register loader from payload/dist for a true test of functionality
  register('../../packages/payload/dist/bin/loader/index.js', url)

  const result = await import(filePath)

  return result
}
