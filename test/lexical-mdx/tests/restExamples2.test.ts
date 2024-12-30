import { readFileSync } from 'fs'
import type { Test } from '../int.spec.js'
import { fileURLToPath } from 'url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const restExamplesTest2: Test = {
  input: readFileSync(path.resolve(dirname, 'restExamples2.input.mdx'), 'utf-8'),
  rootChildren: JSON.parse(
    readFileSync(path.resolve(dirname, 'restExamples2.output.json'), 'utf-8'),
  ).editorState.root.children,
  convertFromEditorJSON: false,
}
