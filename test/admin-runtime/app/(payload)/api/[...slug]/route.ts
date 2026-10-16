import config from '@payload-config'
import { handleEndpoints } from 'payload'

const handler = (request: Request) => handleEndpoints({ config, request })

export const DELETE = handler
export const GET = handler
export const OPTIONS = handler
export const PATCH = handler
export const POST = handler
export const PUT = handler
