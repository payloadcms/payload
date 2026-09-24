import { createPayloadRequestFromWebRequest } from 'payload'
import { createAdminContext } from 'payload/internal'

const handlers = { createPayloadRequest: createPayloadRequestFromWebRequest, initReq: createAdminContext }
const requestKey: string = 'createPayloadRequest'
const contextKey: string = 'initReq'
handlers[requestKey](args)
handlers[contextKey](args)
