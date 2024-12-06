import type { ImportMap } from '../../bin/generateImportMap/index.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { PaginatedDocs } from '../../database/types.js'
import type { PayloadRequest, Sort, Where } from '../../types/index.js'

export type DefaultServerFunctionArgs = {
  importMap: ImportMap
  req: PayloadRequest
}

export type ServerFunctionArgs = {
  args: Record<string, unknown>
  name: string
}

export type ServerFunctionClientArgs = {
  args: Record<string, unknown>
  name: string
}

export type ServerFunctionClient = (args: ServerFunctionClientArgs) => Promise<unknown> | unknown

export type ServerFunction = (
  args: DefaultServerFunctionArgs & ServerFunctionClientArgs['args'],
) => Promise<unknown> | unknown

export type ServerFunctionConfig = {
  fn: ServerFunction
  name: string
}

export type ServerFunctionHandler = (
  args: {
    config: Promise<SanitizedConfig> | SanitizedConfig
    importMap: ImportMap
  } & ServerFunctionClientArgs,
) => Promise<unknown>

export type ListQuery = {
  limit?: string
  page?: string
  /*
    When provided, is automatically injected into the `where` object
  */
  search?: string
  sort?: Sort
  where?: Where
}

export type BuildTableStateArgs = {
  collectionSlug: string
  columns?: any[] // TODO: type this (comes from ui pkg)
  docs?: PaginatedDocs['docs']
  enableRowSelections?: boolean
  query?: ListQuery
  renderRowTypes?: boolean
  req: PayloadRequest
  tableAppearance?: 'condensed' | 'default'
}
