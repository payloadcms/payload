import type { CreateLocalReqOptions as Options, InitReqResult as Result } from 'payload'

import { createLocalReq as local, createPayloadRequest as web } from 'payload'

const req = local(options as Options, payload)
const request = web(input, config)
type Context = Result
