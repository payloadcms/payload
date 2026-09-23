import type { CreatePayloadReqArgs as Options, GetAdminContextResult as Result } from 'payload'

import { createPayloadReq as local, createPayloadReqFromWebRequest as web } from 'payload'

const req = local({ ...options as Options, payload: payload })
const request = web(input, config)
type Context = Result
