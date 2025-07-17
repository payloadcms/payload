'use client'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { type FolderQueryParams, type Where } from 'payload'
import { isNumber } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { FolderQueryParamsProps, IFolderQueryParamsContext } from './types.js'

import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { useRouteTransition } from '../RouteTransition/index.js'
import { FolderQueryParamsContext, FolderQueryParamsModifiedContext } from './context.js'

export { useFolderQueryParams } from './context.js'

export const FolderQueryParamsProvider: React.FC<FolderQueryParamsProps> = ({
  children,
  defaultDocLimit,
  defaultFolderLimit,
  defaultSort,
  modifySearchParams,
  onQueryChange: onQueryChangeFromProps,
}) => {
  const router = useRouter()
  const rawSearchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()
  const [modified, setModified] = useState(false)

  const searchParams = useMemo<FolderQueryParams>(
    () => parseSearchParams(rawSearchParams),
    [rawSearchParams],
  )

  const contextRef = useRef({} as IFolderQueryParamsContext)

  contextRef.current.modified = modified

  const { onQueryChange } = useListDrawerContext()

  const [currentQuery, setCurrentQuery] = useState<FolderQueryParams>(() => {
    if (modifySearchParams) {
      return searchParams
    } else {
      return {
        docLimit: String(defaultDocLimit),
        folderLimit: String(defaultFolderLimit),
        sort: defaultSort,
      }
    }
  })

  const mergeQuery = useCallback(
    (newQuery: FolderQueryParams = {}): FolderQueryParams => {
      let docPage = 'docPage' in newQuery ? newQuery.docPage : currentQuery?.docPage

      if ('where' in newQuery || 'search' in newQuery) {
        docPage = '1'
      }

      const mergedQuery: FolderQueryParams = {
        ...currentQuery,
        ...newQuery,
        docLimit:
          'docLimit' in newQuery
            ? newQuery.docLimit
            : (currentQuery?.docLimit ?? String(defaultDocLimit)),
        docPage,
        folderLimit:
          'folderLimit' in newQuery
            ? newQuery.folderLimit
            : (currentQuery?.folderLimit ?? String(defaultFolderLimit)),
        folderPage: 'folderPage' in newQuery ? newQuery.folderPage : currentQuery?.folderPage,
        search: 'search' in newQuery ? newQuery.search : currentQuery?.search,
        sort: 'sort' in newQuery ? newQuery.sort : ((currentQuery?.sort as string) ?? defaultSort),
      }

      return mergedQuery
    },
    [currentQuery, defaultFolderLimit, defaultDocLimit, defaultSort],
  )

  const refineFolderParams = useCallback(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (incomingQuery: FolderQueryParams, modified?: boolean) => {
      if (modified !== undefined) {
        setModified(modified)
      } else {
        setModified(true)
      }

      const newQuery = mergeQuery(incomingQuery)

      if (modifySearchParams) {
        startRouteTransition(() =>
          router.replace(`${qs.stringify(newQuery, { addQueryPrefix: true })}`),
        )
      } else if (
        typeof onQueryChange === 'function' ||
        typeof onQueryChangeFromProps === 'function'
      ) {
        const onChangeFn = onQueryChange || onQueryChangeFromProps
        onChangeFn(newQuery)
      }

      setCurrentQuery(newQuery)
    },
    [
      mergeQuery,
      modifySearchParams,
      onQueryChange,
      onQueryChangeFromProps,
      startRouteTransition,
      router,
    ],
  )

  const handleDocPageChange = useCallback(
    async (arg: number) => {
      await refineFolderParams({ docPage: String(arg) })
    },
    [refineFolderParams],
  )
  const handleDocPerPageChange = React.useCallback(
    async (arg: number) => {
      await refineFolderParams({ docLimit: String(arg), docPage: '1' })
    },
    [refineFolderParams],
  )

  const handleFolderPageChange = useCallback(
    async (arg: number) => {
      await refineFolderParams({ folderPage: String(arg) })
    },
    [refineFolderParams],
  )
  const handleFolderPerPageChange = useCallback(
    async (arg: number) => {
      await refineFolderParams({ folderLimit: String(arg), folderPage: '1' })
    },
    [refineFolderParams],
  )

  const handleSearchChange = useCallback(
    async (arg: string) => {
      const search = arg === '' ? undefined : arg
      await refineFolderParams({ search })
    },
    [refineFolderParams],
  )

  const handleSortChange = useCallback(
    async (arg: string) => {
      await refineFolderParams({ sort: arg })
    },
    [refineFolderParams],
  )

  const handleWhereChange = useCallback(
    async (arg: Where) => {
      await refineFolderParams({ where: arg })
    },
    [refineFolderParams],
  )

  const handleRelationToChange = useCallback(
    async (relationTo: string[]) => {
      await refineFolderParams({ relationTo })
    },
    [refineFolderParams],
  )

  const syncQuery = useEffectEvent(() => {
    let shouldUpdateQueryString = false
    const newQuery = { ...(currentQuery || {}) }

    // Allow the URL to override the default doc limit
    if (isNumber(defaultDocLimit) && !('docLimit' in currentQuery)) {
      newQuery.docLimit = String(defaultDocLimit)
      shouldUpdateQueryString = true
    }

    // Allow the URL to override the default folder limit
    if (isNumber(defaultFolderLimit) && !('folderLimit' in currentQuery)) {
      newQuery.folderLimit = String(defaultFolderLimit)
      shouldUpdateQueryString = true
    }

    // Allow the URL to override the default sort
    if (defaultSort && !('sort' in currentQuery)) {
      newQuery.sort = defaultSort
      shouldUpdateQueryString = true
    }

    if (shouldUpdateQueryString) {
      setCurrentQuery(newQuery)
      // Do not use router.replace here to avoid re-rendering on initial load
      window.history.replaceState(null, '', `?${qs.stringify(newQuery)}`)
    }
  })

  // If `defaultDocLimit` | `defaultFolderLimit` | `defaultSort` are updated externally, update the query
  // I.e. when HMR runs, these properties may be different
  useEffect(() => {
    if (modifySearchParams) {
      syncQuery()
    }
  }, [defaultSort, defaultFolderLimit, modifySearchParams, defaultDocLimit])

  return (
    <FolderQueryParamsContext
      value={{
        handleDocPageChange,
        handleDocPerPageChange,
        handleFolderPageChange,
        handleFolderPerPageChange,
        handleRelationToChange,
        handleSearchChange,
        handleSortChange,
        handleWhereChange,
        query: currentQuery,
        refineFolderParams,
        setModified,
        ...contextRef.current,
      }}
    >
      <FolderQueryParamsModifiedContext value={modified}>
        {children}
      </FolderQueryParamsModifiedContext>
    </FolderQueryParamsContext>
  )
}
