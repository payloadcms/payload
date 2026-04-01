import { createStartHandler, defaultStreamHandler } from '@tanstack/start/server'

import { createRouter } from './router.js'

export default createStartHandler({ createRouter })(defaultStreamHandler)
