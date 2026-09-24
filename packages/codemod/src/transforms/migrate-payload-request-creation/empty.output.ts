import { createPayloadRequest, createPayloadRequestFromWebRequest, type AdminContext } from 'payload'

const req = await createPayloadRequest({ payload: payload })
const web = createPayloadRequestFromWebRequest(request, config)
type Context = AdminContext
