'use client'
import React, { useEffect, useMemo, useState } from 'react'
import type { Column, TextFieldClientProps } from 'payload'

import {
  Table,
  useForm,
  useFormFields,
  useFormModified,
  useTranslation,
  useWatchForm,
} from '@payloadcms/ui'

import { baseClass } from './shared'

import './index.scss'
import { Product } from '@/payload-types'
import { buildColumns } from '@/collections/Products/ui/Variants/VariantSelect/columns/buildColumns'
import {
  generateCombinations,
  mergeVariants,
} from '@/collections/Products/ui/Variants/VariantSelect/buildCombinations'
import { useIgnoredEffect } from '@/utilities/useIgnoredEffect'

export const VariantSelect: React.FC<TextFieldClientProps> = (props) => {
  const {
    field: { label },
    path,
  } = props

  const { getDataByPath, dispatchFields, setModified } = useForm()
  // const isormModified = useFormModified()
  // Use this hook to reliably trigger refetching the data of variantOptions
  const fields = useWatchForm()

  const { values: initialValues, variantOptions } = useMemo(() => {
    const variantOptions: NonNullable<Product['variantOptions']> = getDataByPath('variantOptions')
    const values: NonNullable<Product['variants']> = getDataByPath(path)
    return { values, variantOptions }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getDataByPath, path, fields])

  const [columns, setColumns] = useState<Column[]>([])
  const [values, setValues] = useState<NonNullable<Product['variants']>>(initialValues ?? [])

  useIgnoredEffect(
    () => {
      if (variantOptions?.length) {
        const combinations = generateCombinations(variantOptions)

        const newVariants = mergeVariants(combinations, values ?? [])

        setValues(newVariants)
      }
    },
    [variantOptions],
    [values],
  )

  useIgnoredEffect(
    () => {
      if (values) {
        // This is a complex function that compares our variants, removes or adds variant rows and updates the existing one
        // depending on changes made in variantOptions
        // It tries to be smart by carefuly merging or inheriting existing values
        let rowsStatus: 'addRows' | 'deleteRows' | 'none' = 'none'

        let hasModified = false

        if (values.length > initialValues.length || !initialValues) {
          rowsStatus = 'addRows'
        } else if (values.length < initialValues.length) {
          rowsStatus = 'deleteRows'
        }

        const rows = rowsStatus === 'addRows' ? values.slice(0, initialValues.length) : values

        rows.forEach((row, rowIndex) => {
          const optionsState: { value: string; slug: string }[] = row.options.map((option) => {
            return {
              value: option.value,
              slug: option.slug,
            }
          })

          const initialKey = initialValues?.[rowIndex]?.options?.length
            ? initialValues?.[rowIndex]?.options.map((o) => `${o.slug}:${o.value}`).join('-')
            : ''
          const newKey = row.options.map((o) => `${o.slug}:${o.value}`).join('-')

          if (initialKey !== newKey) {
            hasModified = true

            dispatchFields({
              type: 'REPLACE_ROW',
              rowIndex,
              path,
              subFieldState: {
                stock: {
                  value: row.stock,
                },
                price: {
                  value: row.price,
                },
                active: {
                  value: true,
                },
                options: {
                  value: optionsState,
                },
              },
            })
          }
        })

        // Handle a change in row count
        switch (rowsStatus) {
          case 'addRows':
            hasModified = true
            const extraRows = values.slice(initialValues.length)

            extraRows.forEach((row) => {
              const optionsState: { value: string; slug: string }[] = row.options.map((option) => {
                return {
                  value: option.value,
                  slug: option.slug,
                }
              })

              let rowIndex

              const inheritedRow = values.find((v, index) => {
                // Check if there's another row with some of the same options, return the first one encountered
                const result = v.options.some((option) => {
                  return row.options.some((newOption) => {
                    return option.slug === newOption.slug && option.value === newOption.value
                  })
                })

                if (result) rowIndex = index

                return result
              })

              console.log({ foundinheritedRow: inheritedRow, insertingAt: rowIndex })

              dispatchFields({
                type: 'ADD_ROW',
                path,
                rowIndex: rowIndex,
                subFieldState: {
                  stock: {
                    value: inheritedRow?.stock ?? row.stock,
                  },
                  price: {
                    value: inheritedRow?.price ?? row.price,
                  },
                  active: {
                    value: true,
                  },
                  options: {
                    value: optionsState,
                  },
                },
              })
            })
            break

          case 'deleteRows':
            hasModified = true
            const extraRowsCount = initialValues.length - values.length

            for (let i = 0; i < extraRowsCount; i++) {
              dispatchFields({
                type: 'REMOVE_ROW',
                path,
                rowIndex: i,
              })
            }
            break
          case 'none':
            break
        }

        if (hasModified) {
          setModified(true)
        }
      }
    },
    [values],
    [dispatchFields, initialValues, path, setModified],
  )

  useEffect(() => {
    if (values) {
      const builtColumns = buildColumns({ values: values, parentPath: path })
      setColumns(builtColumns)
    } else {
      setColumns([])
    }
  }, [path, values])

  const { i18n } = useTranslation()

  return (
    <div className={[baseClass, `${baseClass}Wrapper`].filter(Boolean).join(' ')}>
      <p style={{ marginBottom: '0' }}>{typeof label === 'string' ? label : 'Product'}</p>

      {values && values.length > 0 ? (
        <div className={`${baseClass}VariantsTable`}>
          <Table appearance="condensed" columns={columns} data={values} />
        </div>
      ) : (
        <></>
      )}
    </div>
  )
}
