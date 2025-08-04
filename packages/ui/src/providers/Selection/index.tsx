'use client'
import type { Where } from 'payload'

import { useSearchParams } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { useAuth } from '../Auth/index.js'
import { useListQuery } from '../ListQuery/index.js'
import { useLocale } from '../Locale/index.js'

export enum SelectAllStatus {
  AllAvailable = 'allAvailable',
  AllInPage = 'allInPage',
  None = 'none',
  Some = 'some',
}

type SelectionContext = {
  count: number
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  getQueryParams: (additionalParams?: Where) => string
  getSelectedIds: () => (number | string)[]
  selectAll: SelectAllStatus
  selected: Map<number | string, boolean>
  selectedIDs: (number | string)[]
  setSelection: (id: number | string) => void
  /**
   * Selects all rows on the current page within the current query.
   * If `allAvailable` is true, does not select specific IDs so that the query itself affects all rows across all pages.
   */
  toggleAll: (allAvailable?: boolean) => void
  totalDocs: number
}

const Context = createContext({
  count: undefined,
  getQueryParams: (additionalParams?: Where) => '',
  getSelectedIds: () => [],
  selectAll: undefined,
  selected: new Map(),
  selectedIDs: [],
  setSelection: (id: number | string) => {},
  toggleAll: (toggleAll: boolean) => {},
  totalDocs: undefined,
} satisfies SelectionContext)

type Props = {
  readonly children: React.ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly docs: any[]
  readonly totalDocs: number
}

const reduceActiveSelections = (selected: Map<number | string, boolean>): (number | string)[] => {
  const ids = []

  for (const [key, value] of selected) {
    if (value) {
      ids.push(key)
    }
  }

  return ids
}

export const SelectionProvider: React.FC<Props> = ({ children, docs = [], totalDocs }) => {
  const contextRef = useRef({} as SelectionContext)
  const { user } = useAuth()

  const { code: locale } = useLocale()

  const [selected, setSelected] = useState<SelectionContext['selected']>(() => {
    const rows = new Map()

    docs.forEach(({ id }) => {
      rows.set(id, false)
    })

    return rows
  })

  const [selectAll, setSelectAll] = useState<SelectAllStatus>(SelectAllStatus.None)
  const [count, setCount] = useState(0)
  const searchParams = useSearchParams()
  const { query } = useListQuery()

  const toggleAll: SelectionContext['toggleAll'] = useCallback(
    (allAvailable = false) => {
      const rows = new Map()
      if (allAvailable) {
        setSelectAll(SelectAllStatus.AllAvailable)

        docs.forEach(({ id, _isLocked, _userEditing }) => {
          if (!_isLocked || _userEditing?.id === user?.id) {
            rows.set(id, true)
          }
        })
      } else if (
        // Reset back to `None` if we previously had any type of selection
        selectAll === SelectAllStatus.AllAvailable ||
        selectAll === SelectAllStatus.AllInPage
      ) {
        setSelectAll(SelectAllStatus.None)
      } else {
        docs.forEach(({ id, _isLocked, _userEditing }) => {
          if (!_isLocked || _userEditing?.id === user?.id) {
            rows.set(id, selectAll !== SelectAllStatus.Some)
          }
        })
      }

      setSelected(rows)
    },
    [docs, selectAll, user?.id],
  )

  const setSelection: SelectionContext['setSelection'] = useCallback(
    (id) => {
      const doc = docs.find((doc) => doc.id === id)

      if (doc?._isLocked && user?.id !== doc?._userEditing.id) {
        return // Prevent selection if the document is locked
      }

      const existingValue = selected.get(id)
      const isSelected = typeof existingValue === 'boolean' ? !existingValue : true

      const newMap = new Map(selected.set(id, isSelected))

      // If previously selected all and now deselecting, adjust status
      if (selectAll === SelectAllStatus.AllAvailable && !isSelected) {
        setSelectAll(SelectAllStatus.Some)
      }

      setSelected(newMap)
    },
    [selected, docs, selectAll, user?.id],
  )

  const getQueryParams = useCallback(
    (additionalWhereParams?: Where): string => {
      let where: Where

      if (selectAll === SelectAllStatus.AllAvailable) {
        const params = parseSearchParams(searchParams)?.where as Where

        where = params || {
          id: {
            not_equals: '',
          },
        }
      } else {
        const ids = []

        for (const [key, value] of selected) {
          if (value) {
            ids.push(key)
          }
        }

        where = {
          id: {
            in: ids,
          },
        }
      }

      if (additionalWhereParams) {
        where = {
          and: [{ ...additionalWhereParams }, where],
        }
      }

      return qs.stringify(
        {
          locale,
          where,
        },
        { addQueryPrefix: true },
      )
    },
    [selectAll, selected, locale, searchParams],
  )

  const getSelectedIds = useCallback(() => reduceActiveSelections(selected), [selected])

  useEffect(() => {
    if (selectAll === SelectAllStatus.AllAvailable) {
      return
    }
    let some = false
    let all = true

    if (!selected.size) {
      all = false
      some = false
    } else {
      for (const [_, value] of selected) {
        all = all && value
        some = some || value
      }
    }

    if (all && selected.size === docs.length) {
      setSelectAll(SelectAllStatus.AllInPage)
    } else if (some) {
      setSelectAll(SelectAllStatus.Some)
    } else {
      setSelectAll(SelectAllStatus.None)
    }
  }, [selectAll, selected, totalDocs, docs])

  useEffect(() => {
    let newCount = 0

    if (selectAll === SelectAllStatus.AllAvailable) {
      newCount = totalDocs
    } else {
      for (const [_, value] of selected) {
        if (value) {
          newCount++
        }
      }
    }

    setCount(newCount)
  }, [selectAll, selected, totalDocs])

  useEffect(() => {
    setSelectAll(SelectAllStatus.None)
    setSelected(new Map())
  }, [query])

  const selectedIDs = useMemo(() => reduceActiveSelections(selected), [selected])

  contextRef.current = {
    count,
    getQueryParams,
    getSelectedIds,
    selectAll,
    selected,
    selectedIDs,
    setSelection,
    toggleAll,
    totalDocs,
  }

  return <Context value={contextRef.current}>{children}</Context>
}

export const useSelection = (): SelectionContext => use(Context)
