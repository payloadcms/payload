import type { Column } from 'payload'
import { APIError } from 'payload'

import { headersWithCors } from 'payload'

export const fail = () => new APIError('boom', 500)
export const cors = headersWithCors
export type Col = Column
