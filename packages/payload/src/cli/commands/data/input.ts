import { readFileSync } from 'node:fs'
import path from 'node:path'
import * as z from 'zod/mini'

import type { CollectionSlug } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { File } from '../../../uploads/types.js'

import {
  externalURLInputSchema,
  resolveURLUploadInput,
} from '../../../uploads/resolveURLUploadInput.js'

export const localFileSchema = z.union([
  z.string().check(z.minLength(1), z.describe('Local upload file path.')),
  externalURLInputSchema,
])

type LocalFileInput = z.infer<typeof localFileSchema>

/** Resolves a CLI upload input to either a local path or a downloaded Payload file. */
export const resolveCLIFile = async ({
  slug,
  input,
  req,
}: {
  input?: LocalFileInput
  req: PayloadRequest
  slug: CollectionSlug
}): Promise<{ file?: File; filePath?: string }> => {
  if (!input) {
    return {}
  }

  if (typeof input === 'string') {
    return { filePath: path.resolve(process.cwd(), input) }
  }

  return { file: await resolveURLUploadInput({ slug, input, req, requireAllowList: false }) }
}

export const parseBoolean = (value: string): boolean => {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  throw new Error('Expected true or false.')
}

export const parseFallbackLocale = (value: string): false | string =>
  value === 'false' ? false : value

export const parseJSON = (value: string): unknown => {
  let source = value

  if (value.startsWith('@')) {
    source = readFileSync(path.resolve(process.cwd(), value.slice(1)), 'utf8')
  }

  try {
    return JSON.parse(source)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Invalid JSON.')
  }
}

export const parseFile = (value: string): unknown =>
  value.startsWith('{') || value.startsWith('@') ? parseJSON(value) : value

export const parseDocuments = (value: string, previous: unknown): unknown[] => {
  const parsed = parseJSON(value)
  const previousValues = Array.isArray(previous) ? previous : []

  return [...previousValues, ...(Array.isArray(parsed) ? parsed : [parsed])]
}

export const parseSelectedLocales = (value: string, previous: unknown): string[] => [
  ...(Array.isArray(previous) ? previous : []),
  ...value.split(',').filter(Boolean),
]

export const parseSort = (value: string, previous: unknown): string | string[] => {
  if (Array.isArray(previous)) {
    return [...previous.filter((item): item is string => typeof item === 'string'), value]
  }

  return typeof previous === 'string' ? [previous, value] : value
}
