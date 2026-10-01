import { createPayloadRequest } from 'payload'
import { initReq } from 'payload/internal'

const handlers = { createPayloadRequest, initReq }
const requestKey: string = 'createPayloadRequest'
const contextKey: string = 'initReq'
handlers[requestKey](args)
handlers[contextKey](args)
