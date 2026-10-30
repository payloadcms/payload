import type { CreateLocalReqOptions as Options, InitReqResult as Result } from 'payload'

import { createLocalReq as local, createPayloadRequest as web } from 'payload'

const options: Options = { user }
const req = local(options, payload)
const request = web(input, config)
type Context = Result
