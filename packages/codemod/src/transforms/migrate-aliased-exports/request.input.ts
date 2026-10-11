import { createPayloadRequest } from '@payloadcms/next/utilities'
import { createPayloadRequest as webRequest, unrelated } from '@payloadcms/next/utilities'

const req = createPayloadRequest(args)
const aliased = webRequest(args)
