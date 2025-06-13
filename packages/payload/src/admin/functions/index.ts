import type { ImportMap } from '../../bin/generateImportMap/index.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { PaginatedDocs } from '../../database/types.js'
import type { CollectionSlug, ColumnPreference } from '../../index.js'
import type { PayloadRequest, Sort, Where } from '../../types/index.js'
import type { ColumnsFromURL } from '../../utilities/transformColumnPreferences.js'

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

export type ServerFunction<
  TArgs extends object = Record<string, unknown>,
  TReturnType = Promise<unknown> | unknown,
> = (args: DefaultServerFunctionArgs & TArgs) => TReturnType

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
  /*
   * This is an of strings, i.e. `['title', '-slug']`
   * Use `transformColumnsToPreferences` and `transformColumnsToSearchParams` to convert it back and forth
   */
  columns?: ColumnsFromURL
  limit?: string
  page?: string
  preset?: number | string
  /*
    When provided, is automatically injected into the `where` object
  */
  search?: string
  sort?: Sort
  where?: Where
} & Record<string, unknown>

export type BuildTableStateArgs = {
  collectionSlug: string | string[]
  columns?: ColumnPreference[]
  docs?: PaginatedDocs['docs']
  enableRowSelections?: boolean
  orderableFieldName: string
  parent?: {
    collectionSlug: CollectionSlug
    id: number | string
    joinPath: string
  }
  query?: ListQuery
  renderRowTypes?: boolean
  req: PayloadRequest
  tableAppearance?: 'condensed' | 'default'
}

export type BuildCollectionFolderViewResult = {
  View: React.ReactNode
}

export type GetFolderResultsComponentAndDataArgs = {
  activeCollectionSlugs: CollectionSlug[]
  browseByFolder: boolean
  displayAs: 'grid' | 'list'
  folderID: number | string | undefined
  req: PayloadRequest
  sort: string
}
