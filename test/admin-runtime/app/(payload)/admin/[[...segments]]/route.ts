import config from '@payload-config'
import { createAdminHandler } from '@payloadcms/admin-runtime'

const handler = createAdminHandler({ config })

export const GET = handler
export const POST = handler
