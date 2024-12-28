import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync, writeFileSync, readFileSync } from 'fs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const tsConfigBasePath = path.resolve(dirname, '../tsconfig.base.json')
const tsconfigGeneratedPath = path.resolve(dirname, '../tsconfig.generated.json')

if (!existsSync(tsconfigGeneratedPath)) {
  const tsConfigContent = readFileSync(tsConfigBasePath, 'utf8')
  writeFileSync(tsconfigGeneratedPath, tsConfigContent, 'utf-8')
}
