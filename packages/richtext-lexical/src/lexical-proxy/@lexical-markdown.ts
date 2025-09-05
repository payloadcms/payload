export * from '../packages/@lexical/markdown/index.js'

// https://stackoverflow.com/a/48953568
// https://stackoverflow.com/questions/48951687/override-an-export-from-another-library-es6
export { normalizeMarkdown } from '../packages/@lexical/markdown/MarkdownTransformers.js'

export * from '@lexical/markdown'
