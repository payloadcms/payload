import { createPayloadReqFromWebRequest } from 'payload'
import { getAdminContext } from 'payload/internal'

const handlers = { createPayloadRequest: createPayloadReqFromWebRequest, initReq: getAdminContext }
const requestKey: string = 'createPayloadRequest'
const contextKey: string = 'initReq'
handlers[requestKey](args)
handlers[contextKey](args)
