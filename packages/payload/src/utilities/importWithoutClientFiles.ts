import { register } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const importWithoutClientFiles = async <T = unknown>(filePath: string) => {
  const url = pathToFileURL(filePath).toString()

  register(path.resolve(dirname, '../../dist/bin/register/index.js'), url)
  const result = await import(filePath)
  return result as T
}
