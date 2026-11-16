import { createPayloadRequestFromWebRequest } from 'payload'
import { initAdminContext } from 'payload/internal'

const handlers = { createPayloadRequest: createPayloadRequestFromWebRequest, initReq: initAdminContext }
const requestKey: string = 'createPayloadRequest'
const contextKey: string = 'initReq'
handlers[requestKey](args)
handlers[contextKey](args)
