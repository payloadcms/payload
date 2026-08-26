import crypto from 'crypto'

/** Generates a random API key for explicit key rotations. */
export const generateAPIKey = (): string => crypto.randomUUID()
