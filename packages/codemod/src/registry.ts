import type { Transform } from './types.js'

import { consolidateDisabledFields } from './transforms/consolidate-disabled-fields/index.js'
import { exampleNoop } from './transforms/example-noop/index.js'

export const transforms: Transform[] = [exampleNoop, consolidateDisabledFields]
