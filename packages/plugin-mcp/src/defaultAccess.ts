import type { MCPAccessArgs } from './types.js'

export const defaultAccess = ({ req }: MCPAccessArgs): boolean => Boolean(req.user)
