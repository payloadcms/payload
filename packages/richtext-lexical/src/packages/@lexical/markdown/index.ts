import type {
  MultilineElementTransformer,
  TextMatchTransformer,
  Transformer,
} from '@lexical/markdown'

import { ELEMENT_TRANSFORMERS, TEXT_FORMAT_TRANSFORMERS } from '@lexical/markdown'

import { PAYLOAD_LINK_TRANSFORMER } from '../../../features/link/markdownTransformer.js'

// In Lexical includes CODE
const MULTILINE_ELEMENT_TRANSFORMERS: Array<MultilineElementTransformer> = []

// In Lexical includes LINK
const TEXT_MATCH_TRANSFORMERS: Array<TextMatchTransformer> = [PAYLOAD_LINK_TRANSFORMER]

const TRANSFORMERS: Array<Transformer> = [
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
]

export { MULTILINE_ELEMENT_TRANSFORMERS, TEXT_MATCH_TRANSFORMERS, TRANSFORMERS }
