import type { ImportMap } from '../../bin/generateImportMap/index.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { Payload } from '../../types/index.js'

export type BaseServerFunctionArgs = {
  config: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  payload: Payload
}

export type ServerFunctionArgs = {
  args: Record<string, unknown>
  name: string
}

export type ServerFunction = (args: ServerFunctionArgs) => Promise<unknown>

export type ServerFunctionConfig = {
  function: ServerFunction
  name: string
}

export type RootServerFunctionArgs = BaseServerFunctionArgs & ServerFunctionArgs

export type RootServerFunction = (args: RootServerFunctionArgs) => Promise<unknown>
