import { createLocalReq, createPayloadRequest, type InitReqResult } from 'payload'

const req = await createLocalReq({}, payload)
const web = createPayloadRequest(request, config)
type Context = InitReqResult
