import type { Transform } from './types.js'

import { exampleNoop } from './transforms/example-noop/index.js'
import { globalsComponentsEdit } from './transforms/globals-components-edit/index.js'

export const transforms: Transform[] = [exampleNoop, globalsComponentsEdit]
