'use client'
import type { ClientUser, Where } from 'payload'

import * as qs from 'qs-esm'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { useLocale } from '../Locale/index.js'
import { useSearchParams } from '../SearchParams/index.js'

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
  selectAll: SelectAllStatus
  selected: Map<number | string, boolean>
  setSelection: (id: number | string) => void
  toggleAll: (allAvailable?: boolean) => void
  totalDocs: number
}

const Context = createContext({} as SelectionContext)

type Props = {
  readonly children: React.ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly docs: any[]
  readonly totalDocs: number
  user: ClientUser
}

export const SelectionProvider: React.FC<Props> = ({ children, docs = [], totalDocs, user }) => {
  const contextRef = useRef({} as SelectionContext)

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
  const { searchParams } = useSearchParams()

  const toggleAll = useCallback(
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

  const setSelection = useCallback(
    (id) => {
      const doc = docs.find((doc) => doc.id === id)

      if (doc?._isLocked && user?.id !== doc?._userEditing.id) {
        return // Prevent selection if the document is locked
      }

      const existingValue = selected.get(id)
      const isSelected = typeof existingValue === 'boolean' ? !existingValue : true

      let newMap = new Map()

      if (isSelected) {
        newMap = new Map(selected.set(id, isSelected))
      } else {
        newMap = new Map(selected.set(id, false))
      }

      setSelected(newMap)
    },
    [selected, docs, user?.id],
  )

  const getQueryParams = useCallback(
    (additionalParams?: Where): string => {
      let where: Where
      if (selectAll === SelectAllStatus.AllAvailable) {
        const params = searchParams?.where as Where
        where = params || {
          id: { not_equals: '' },
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
      if (additionalParams) {
        where = {
          and: [{ ...additionalParams }, where],
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
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setSelectAll(SelectAllStatus.AllInPage)
    } else if (some) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setSelectAll(SelectAllStatus.Some)
    } else {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
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

    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setCount(newCount)
  }, [selectAll, selected, totalDocs])

  contextRef.current = {
    count,
    getQueryParams,
    selectAll,
    selected,
    setSelection,
    toggleAll,
    totalDocs,
  }

  return <Context.Provider value={contextRef.current}>{children}</Context.Provider>
}

export const useSelection = (): SelectionContext => useContext(Context)
