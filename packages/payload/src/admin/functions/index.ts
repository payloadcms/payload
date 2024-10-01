import type { ImportMap } from '../../bin/generateImportMap/index.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { PayloadRequest } from '../../types/index.js'

export type DefaultServerFunctionArgs = {
  importMap: ImportMap
  req: PayloadRequest
}

export type ServerFunctionArgs = {
  args: Record<string, unknown>
  name: string
}

export type ClientServerFunctionArgs = {
  args: Record<string, unknown>
  name: string
}

export type ClientServerFunction = (args: ClientServerFunctionArgs) => Promise<unknown> | unknown

export type ServerFunction = (
  args: ClientServerFunctionArgs['args'] & DefaultServerFunctionArgs,
) => Promise<unknown> | unknown

export type ServerFunctionConfig = {
  fn: ServerFunction
  name: string
}

export type ServerFunctionHandler = (
  args: {
    config: Promise<SanitizedConfig> | SanitizedConfig
    importMap: ImportMap
  } & ClientServerFunctionArgs,
) => Promise<unknown>
