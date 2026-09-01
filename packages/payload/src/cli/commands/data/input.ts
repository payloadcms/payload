import { readFileSync } from 'node:fs'
import path from 'node:path'

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

export const parseSort = (value: string, previous: unknown): string | string[] => {
  if (Array.isArray(previous)) {
    return [...previous.filter((item): item is string => typeof item === 'string'), value]
  }

  return typeof previous === 'string' ? [previous, value] : value
}
