import type { Transform } from './types.js'

import { exampleNoop } from './transforms/example-noop/index.js'
import { removeHideAPIURL } from './transforms/remove-hide-api-url/index.js'

export const transforms: Transform[] = [exampleNoop, removeHideAPIURL]
