import { createStartHandler } from '@tanstack/react-start/server'

import { getRouter } from './router.js'

export default createStartHandler({ createRouter: getRouter })
