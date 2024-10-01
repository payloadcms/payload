import type { ImportMap } from '../../bin/generateImportMap/index.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { Payload } from '../../types/index.js'

export type BaseServerFunctionArgs = {
  config: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  payload: Payload
}

export type ServerFunctionArgs = BaseServerFunctionArgs & Record<string, unknown>

export type ClientServerFunction = (args: Record<string, unknown>) => Promise<unknown> | unknown

export type ServerFunction = (args: ServerFunctionArgs) => Promise<unknown> | unknown

export type ServerFunctionConfig = {
  function: ServerFunction
  name: string
}

export type RootServerFunction = (args: ServerFunctionArgs) => Promise<unknown>
