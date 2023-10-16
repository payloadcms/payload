import type { HTMLConverter } from './types'

import { ParagraphConverter } from './converters/paragraph'
import { TextConverter } from './converters/text'

export const defaultConverters: HTMLConverter[] = [TextConverter, ParagraphConverter]
