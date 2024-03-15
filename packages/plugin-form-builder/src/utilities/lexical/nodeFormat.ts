/* eslint-disable perfectionist/sort-objects */
/* eslint-disable regexp/no-obscure-range */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
//This copy-and-pasted from lexical here: https://github.com/facebook/lexical/blob/c2ceee223f46543d12c574e62155e619f9a18a5d/packages/lexical/src/LexicalConstants.ts

// DOM
export const NodeFormat = {
  DOM_ELEMENT_TYPE: 1,
  DOM_TEXT_TYPE: 3,
  // Reconciling
  NO_DIRTY_NODES: 0,
  HAS_DIRTY_NODES: 1,
  FULL_RECONCILE: 2,
  // Text node modes
  IS_NORMAL: 0,
  IS_TOKEN: 1,
  IS_SEGMENTED: 2,
  IS_INERT: 3,
  // Text node formatting
  IS_BOLD: 1,
  IS_ITALIC: 1 << 1,
  IS_STRIKETHROUGH: 1 << 2,
  IS_UNDERLINE: 1 << 3,
  IS_CODE: 1 << 4,
  IS_SUBSCRIPT: 1 << 5,
  IS_SUPERSCRIPT: 1 << 6,
  IS_HIGHLIGHT: 1 << 7,
  // Text node details
  IS_DIRECTIONLESS: 1,
  IS_UNMERGEABLE: 1 << 1,
  // Element node formatting
  IS_ALIGN_LEFT: 1,
  IS_ALIGN_CENTER: 2,
  IS_ALIGN_RIGHT: 3,
  IS_ALIGN_JUSTIFY: 4,
  IS_ALIGN_START: 5,
  IS_ALIGN_END: 6,
} as const

export const IS_ALL_FORMATTING =
  NodeFormat.IS_BOLD |
  NodeFormat.IS_ITALIC |
  NodeFormat.IS_STRIKETHROUGH |
  NodeFormat.IS_UNDERLINE |
  NodeFormat.IS_CODE |
  NodeFormat.IS_SUBSCRIPT |
  NodeFormat.IS_SUPERSCRIPT |
  NodeFormat.IS_HIGHLIGHT

// Reconciliation
export const NON_BREAKING_SPACE = '\u00A0'

export const DOUBLE_LINE_BREAK = '\n\n'

// For FF, we need to use a non-breaking space, or it gets composition
// in a stuck state.

const RTL = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC'
const LTR =
  'A-Za-z\u00C0-\u00D6\u00D8-\u00F6' +
  '\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C' +
  '\uFE00-\uFE6F\uFEFD-\uFFFF'

// eslint-disable-next-line no-misleading-character-class,regexp/no-misleading-unicode-character
export const RTL_REGEX = new RegExp('^[^' + LTR + ']*[' + RTL + ']')
// eslint-disable-next-line no-misleading-character-class,regexp/no-misleading-unicode-character
export const LTR_REGEX = new RegExp('^[^' + RTL + ']*[' + LTR + ']')

export const TEXT_TYPE_TO_FORMAT: Record<any | string, number> = {
  bold: NodeFormat.IS_BOLD,
  code: NodeFormat.IS_CODE,
  highlight: NodeFormat.IS_HIGHLIGHT,
  italic: NodeFormat.IS_ITALIC,
  strikethrough: NodeFormat.IS_STRIKETHROUGH,
  subscript: NodeFormat.IS_SUBSCRIPT,
  superscript: NodeFormat.IS_SUPERSCRIPT,
  underline: NodeFormat.IS_UNDERLINE,
}

export const DETAIL_TYPE_TO_DETAIL: Record<any | string, number> = {
  directionless: NodeFormat.IS_DIRECTIONLESS,
  unmergeable: NodeFormat.IS_UNMERGEABLE,
}

export const ELEMENT_TYPE_TO_FORMAT: Record<Exclude<any, ''>, number> = {
  center: NodeFormat.IS_ALIGN_CENTER,
  end: NodeFormat.IS_ALIGN_END,
  justify: NodeFormat.IS_ALIGN_JUSTIFY,
  left: NodeFormat.IS_ALIGN_LEFT,
  right: NodeFormat.IS_ALIGN_RIGHT,
  start: NodeFormat.IS_ALIGN_START,
}

export const ELEMENT_FORMAT_TO_TYPE: Record<number, any> = {
  [NodeFormat.IS_ALIGN_CENTER]: 'center',
  [NodeFormat.IS_ALIGN_END]: 'end',
  [NodeFormat.IS_ALIGN_JUSTIFY]: 'justify',
  [NodeFormat.IS_ALIGN_LEFT]: 'left',
  [NodeFormat.IS_ALIGN_RIGHT]: 'right',
  [NodeFormat.IS_ALIGN_START]: 'start',
}

export const TEXT_MODE_TO_TYPE: Record<any, 0 | 1 | 2> = {
  normal: NodeFormat.IS_NORMAL,
  segmented: NodeFormat.IS_SEGMENTED,
  token: NodeFormat.IS_TOKEN,
}

export const TEXT_TYPE_TO_MODE: Record<number, any> = {
  [NodeFormat.IS_NORMAL]: 'normal',
  [NodeFormat.IS_SEGMENTED]: 'segmented',
  [NodeFormat.IS_TOKEN]: 'token',
}
