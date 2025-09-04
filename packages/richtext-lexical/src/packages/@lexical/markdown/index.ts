/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ELEMENT_TRANSFORMERS, TEXT_FORMAT_TRANSFORMERS } from '@lexical/markdown'

import type {
  ElementTransformer,
  MultilineElementTransformer,
  TextFormatTransformer,
  TextMatchTransformer,
  Transformer,
} from './MarkdownTransformers.js'

import { PAYLOAD_LINK_TRANSFORMER } from '../../../features/link/markdownTransformer.js'
import { registerMarkdownShortcuts } from './MarkdownShortcuts.js'
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CHECK_LIST,
  HEADING,
  HIGHLIGHT,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
} from './MarkdownTransformers.js'

const MULTILINE_ELEMENT_TRANSFORMERS: Array<MultilineElementTransformer> = []

const TEXT_MATCH_TRANSFORMERS: Array<TextMatchTransformer> = [PAYLOAD_LINK_TRANSFORMER]

const TRANSFORMERS: Array<Transformer> = [
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
]

export {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  CHECK_LIST,
  type ElementTransformer,
  HEADING,
  HIGHLIGHT,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  MULTILINE_ELEMENT_TRANSFORMERS,
  type MultilineElementTransformer,
  ORDERED_LIST,
  QUOTE,
  registerMarkdownShortcuts,
  STRIKETHROUGH,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  type TextFormatTransformer,
  type TextMatchTransformer,
  type Transformer,
  TRANSFORMERS,
  UNORDERED_LIST,
}
