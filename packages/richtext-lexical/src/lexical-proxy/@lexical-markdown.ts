// It is possible to override a specific module in this way. See:
// https://stackoverflow.com/a/48953568
// https://stackoverflow.com/questions/48951687/override-an-export-from-another-library-es6

export {
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  TRANSFORMERS,
} from '../packages/@lexical/markdown/index.js'

// TODO: Port our improved version of normalizeMarkdown to the
// Lexical repository and remove it from our repo
export { normalizeMarkdown } from '../packages/@lexical/markdown/MarkdownTransformers.js'

export * from '@lexical/markdown'
