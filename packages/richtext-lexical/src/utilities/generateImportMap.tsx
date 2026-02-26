import type { ResolvedServerFeatureMap } from '../features/typesServer.js'
import type { LexicalEditorProps } from '../types.js'

export const getGenerateImportMap =
  (_args: {
    lexicalEditorArgs?: LexicalEditorProps
    resolvedFeatureMap: ResolvedServerFeatureMap
  }): (() => void) =>
  () => {}
