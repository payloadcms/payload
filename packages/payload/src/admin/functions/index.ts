import type { AcceptedLanguages } from '@payloadcms/translations'

import type { ImportMap } from '../../bin/generateImportMap/index.js'
import type { Locale, SanitizedConfig } from '../../config/types.js'
import type { PaginatedDocs } from '../../database/types.js'
import type { Slugify } from '../../fields/baseFields/slug/index.js'
import type {
  CollectionSlug,
  ColumnPreference,
  FieldPaths,
  FolderSortKeys,
  GlobalSlug,
  SanitizedPermissions,
} from '../../index.js'
import type { PayloadRequest, Sort, Where } from '../../types/index.js'
import type { ColumnsFromURL } from '../../utilities/transformColumnPreferences.js'

export type InitReqResult = {
  cookies: Map<string, string>
  // TODO: Remove in 4.0. Duplicative, already available in req.headers
  headers: Headers
  // TODO: Remove in 4.0. Duplicative, already available in req.i18n.language
  languageCode: AcceptedLanguages
  locale?: Locale
  permissions: SanitizedPermissions
  req: PayloadRequest
}

export type DefaultServerFunctionArgs = {
  importMap: ImportMap
} & Pick<InitReqResult, 'cookies' | 'locale' | 'permissions' | 'req'>

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
    /**
     * A map of server function names to their implementations. These are
     * registered alongside the base server functions and can be called
     * using the useServerFunctions() hook.
     *
     * @example
     * const { serverFunction } = useServerFunctions()
     *
     * const callServerFunction = useCallback(() => {
     *
     *  async function call() {
     *   const result = (await serverFunction({
     *    name: 'record-key',
     *    args: {
     *     // Your args
     *    },
     *   }))
     *
     *   // Do someting with the result
     *  }
     *
     *  void call()
     * }, [serverFunction])
     */
    serverFunctions?: Record<string, ServerFunction<any, any>>
  } & ServerFunctionClientArgs,
) => Promise<unknown>

export type ListQuery = {
  /*
   * This is an of strings, i.e. `['title', '-slug']`
   * Use `transformColumnsToPreferences` and `transformColumnsToSearchParams` to convert it back and forth
   */
  columns?: ColumnsFromURL
  /*
   * A string representing the field to group by, e.g. `category`
   * A leading hyphen represents descending order, e.g. `-category`
   */
  groupBy?: string
  limit?: number
  page?: number
  preset?: number | string
  queryByGroup?: Record<string, ListQuery>
  /*
    When provided, is automatically injected into the `where` object
  */
  search?: string
  sort?: Sort
  where?: Where
} & Record<string, unknown>

export type BuildTableStateArgs = {
  /**
   * If an array is provided, the table will be built to support polymorphic collections.
   */
  collectionSlug: string | string[]
  columns?: ColumnPreference[]
  data?: PaginatedDocs
  /**
   * @deprecated Use `data` instead
   */
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
  tableAppearance?: 'condensed' | 'default'
}

export type SlugifyServerFunctionArgs = {
  collectionSlug?: CollectionSlug
  globalSlug?: GlobalSlug
  path?: FieldPaths['path']
} & Omit<Parameters<Slugify>[0], 'req'>
