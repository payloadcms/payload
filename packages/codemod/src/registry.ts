import type { Transform } from './types.js'

import { exampleNoop } from './transforms/example-noop/index.js'

export const transforms: Transform[] = [exampleNoop]
