import type { Column } from '@payloadcms/ui'
import { APIError } from 'payload'

import { headersWithCors } from '@payloadcms/next/utilities'

export const fail = () => new APIError('boom', 500)
export const cors = headersWithCors
export type Col = Column
