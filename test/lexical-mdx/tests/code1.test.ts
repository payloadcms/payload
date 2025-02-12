import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Test } from '../int.spec.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const codeTest1: Test = {
  input: readFileSync(path.resolve(dirname, 'code1.input.mdx'), 'utf-8'),
  rootChildren: JSON.parse(readFileSync(path.resolve(dirname, 'code1.output.json'), 'utf-8'))
    .editorState.root.children,
}
