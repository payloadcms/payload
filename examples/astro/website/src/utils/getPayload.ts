import { getPayload as _getPayload } from 'payload'
import { resolveConfig } from 'payload-app'

export const getPayload = () => _getPayload({ config: resolveConfig(import.meta.env) })
