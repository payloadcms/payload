import { login } from '@payloadcms/next/routes/login'
import config from 'payload-config'

export const POST = login({ config })
