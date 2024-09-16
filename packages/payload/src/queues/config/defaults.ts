import type { QueueConfig } from './types.js'

import defaultAccess from '../../auth/defaultAccess.js'

export const queueDefaults: Partial<QueueConfig> = {
  access: {
    run: defaultAccess,
  },
  deleteJobOnComplete: true,
}
