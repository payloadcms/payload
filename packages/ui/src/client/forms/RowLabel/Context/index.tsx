'use client'

import React from 'react'

import { useWatchForm } from '../../Form/context.js'

type RowLabelType<T = unknown> = {
  readonly data: T
  readonly path: string
  readonly rowNumber?: number
}

const RowLabel = React.createContext<RowLabelType>({
  data: {},
  path: '',
  rowNumber: undefined,
})

type Props<T> = {
  readonly children: React.ReactNode
} & Omit<RowLabelType<T>, 'data'>

export const RowLabelProvider: React.FC<Props<unknown>> = ({ children, path, rowNumber }) => {
  const { getDataByPath, getSiblingData } = useWatchForm()
  const collapsibleData = getSiblingData(path)
  const arrayData = getDataByPath(path)

  const data = arrayData || collapsibleData

  const contextValue = React.useMemo(() => ({ data, path, rowNumber }), [data, path, rowNumber])

  return <RowLabel value={contextValue}>{children}</RowLabel>
}

export const useRowLabel = <T,>() => {
  return React.use(RowLabel) as RowLabelType<T>
}
