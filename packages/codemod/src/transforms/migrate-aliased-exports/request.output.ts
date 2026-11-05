import { createPayloadRequestFromWebRequest as createPayloadRequest, createPayloadRequestFromWebRequest as webRequest } from 'payload'
import { unrelated } from '@payloadcms/next/utilities'

const req = createPayloadRequest(args)
const aliased = webRequest(args)
