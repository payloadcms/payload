import { createPayloadRequest, createPayloadRequestFromWebRequest, type CreateAdminContextResult } from 'payload'

const req = await createPayloadRequest({ payload: payload })
const web = createPayloadRequestFromWebRequest(request, config)
type Context = CreateAdminContextResult
