/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  MultilineElementTransformer,
  TextMatchTransformer,
  Transformer,
} from '@lexical/markdown'

import { ELEMENT_TRANSFORMERS, TEXT_FORMAT_TRANSFORMERS } from '@lexical/markdown'

import { PAYLOAD_LINK_TRANSFORMER } from '../../../features/link/markdownTransformer.js'
import { registerMarkdownShortcuts } from './MarkdownShortcuts.js'

const MULTILINE_ELEMENT_TRANSFORMERS: Array<MultilineElementTransformer> = []

const TEXT_MATCH_TRANSFORMERS: Array<TextMatchTransformer> = [PAYLOAD_LINK_TRANSFORMER]

const TRANSFORMERS: Array<Transformer> = [
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
]

export {
  MULTILINE_ELEMENT_TRANSFORMERS,
  registerMarkdownShortcuts,
  TEXT_MATCH_TRANSFORMERS,
  TRANSFORMERS,
}
