import { KeysCell } from '@/collections/Products/ui/Variants/VariantSelect/columns/KeysCell'
import { ActiveInput } from './ActiveInput'
import { PriceInput } from './PriceInput/index'
import { StockInput } from './StockInput'
import { Product } from '@/payload-types'
import { Column } from 'payload'
import React from 'react'

type Props = {
  values: NonNullable<Product['variants']>
  parentPath: string
}

export const buildColumns = (args: Props): Column[] => {
  const { values, parentPath } = args

  const columns: Column[] = [
    {
      active: true,
      field: {
        type: 'checkbox',
        name: '',
      },
      Heading: <>Active</>,
      renderedCells: values.map((value, index) => {
        return (
          <div key={`active-${value.id}`} className="checkboxContainer">
            <ActiveInput path={`${parentPath}.${index}.active`} />
          </div>
        )
      }),
      accessor: 'active',
    },
    {
      active: true,
      field: {
        type: 'array',
        name: '',
        fields: [],
      },
      Heading: <>Variant</>,
      renderedCells: values.map((value) => {
        const keys = value.options

        return <KeysCell key={`keys-${value.id}`} keys={keys} />
      }),
      accessor: 'keys',
    },
    {
      active: true,
      field: {
        type: 'number',
        name: '',
      },
      Heading: <>Price</>,
      renderedCells: values.map((value, index) => {
        return <PriceInput key={`price-${value.id}`} path={`${parentPath}.${index}.price`} />
      }),
      accessor: 'price',
    },
    {
      active: true,
      field: {
        type: 'number',
        name: '',
      },
      Heading: <>Stock</>,
      renderedCells: values.map((value, index) => {
        return (
          <div key={`stock-${value.id}`}>
            <StockInput path={`${parentPath}.${index}.stock`} />
          </div>
        )
      }),
      accessor: 'stock',
    },
  ]

  return columns
}
