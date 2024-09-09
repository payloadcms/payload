'use client'
import type { Where } from 'payload'

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
  selected: Record<number | string, boolean>
  setSelection: (id: number | string) => void
  toggleAll: (allAvailable?: boolean) => void
  totalDocs: number
}

const Context = createContext({} as SelectionContext)

type Props = {
  readonly children: React.ReactNode
  readonly docs: any[]
  readonly totalDocs: number
}

export const SelectionProvider: React.FC<Props> = ({ children, docs = [], totalDocs }) => {
  const contextRef = useRef({} as SelectionContext)

  const { code: locale } = useLocale()
  const [selected, setSelected] = useState<SelectionContext['selected']>(() => {
    const rows = {}
    docs.forEach(({ id }) => {
      rows[id] = false
    })
    return rows
  })
  const [selectAll, setSelectAll] = useState<SelectAllStatus>(SelectAllStatus.None)
  const [count, setCount] = useState(0)
  const { searchParams } = useSearchParams()

  const toggleAll = useCallback(
    (allAvailable = false) => {
      const rows = {}
      if (allAvailable) {
        setSelectAll(SelectAllStatus.AllAvailable)
        docs.forEach(({ id }) => {
          rows[id] = true
        })
      } else if (
        selectAll === SelectAllStatus.AllAvailable ||
        selectAll === SelectAllStatus.AllInPage
      ) {
        setSelectAll(SelectAllStatus.None)
        docs.forEach(({ id }) => {
          rows[id] = false
        })
      } else {
        docs.forEach(({ id }) => {
          rows[id] = selectAll !== SelectAllStatus.Some
        })
      }
      setSelected(rows)
    },
    [docs, selectAll],
  )

  const setSelection = useCallback(
    (id) => {
      const isSelected = !selected[id]
      const newSelected = {
        ...selected,
        [id]: isSelected,
      }
      if (!isSelected) {
        setSelectAll(SelectAllStatus.Some)
      }
      setSelected(newSelected)
    },
    [selected],
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
        where = {
          id: {
            in: Object.keys(selected)
              .filter((id) => selected[id])
              .map((id) => id),
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

    if (!Object.values(selected).length) {
      all = false
      some = false
    } else {
      Object.values(selected).forEach((val) => {
        all = all && val
        some = some || val
      })
    }

    if (all) {
      setSelectAll(SelectAllStatus.AllInPage)
    } else if (some) {
      setSelectAll(SelectAllStatus.Some)
    } else {
      setSelectAll(SelectAllStatus.None)
    }
  }, [selectAll, selected])

  useEffect(() => {
    const newCount =
      selectAll === SelectAllStatus.AllAvailable
        ? totalDocs
        : Object.keys(selected).filter((id) => selected[id]).length
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
