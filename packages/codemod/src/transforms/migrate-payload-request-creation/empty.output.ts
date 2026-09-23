import { createPayloadReq, createPayloadReqFromWebRequest, type GetAdminContextResult } from 'payload'

const req = await createPayloadReq({ payload: payload })
const web = createPayloadReqFromWebRequest(request, config)
type Context = GetAdminContextResult
