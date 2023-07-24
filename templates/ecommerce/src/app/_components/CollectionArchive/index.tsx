'use client'

import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import qs from 'qs'

import { Product } from '../../../payload/payload-types'
import type { ArchiveBlockProps } from '../../_blocks/ArchiveBlock/types'
import { Card } from '../Card'
import { Gutter } from '../Gutter'
import { PageRange } from '../PageRange'
import { Pagination } from '../Pagination'
import { RenderParams } from '../RenderParams'

import classes from './index.module.scss'

type Result = {
  totalDocs: number
  docs: Product[]
  page: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
  nextPage: number
  prevPage: number
}

export type Props = {
  className?: string
  relationTo?: 'products'
  populateBy?: 'collection' | 'selection'
  showPageRange?: boolean
  onResultChange?: (result: Result) => void // eslint-disable-line no-unused-vars
  sort?: string
  limit?: number
  populatedDocs?: ArchiveBlockProps['populatedDocs']
  populatedDocsTotal?: ArchiveBlockProps['populatedDocsTotal']
  categories?: ArchiveBlockProps['categories']
}

export const CollectionArchive: React.FC<Props> = props => {
  const {
    className,
    relationTo,
    showPageRange,
    onResultChange,
    sort = '-createdAt',
    limit = 10,
    populatedDocs,
    populatedDocsTotal,
    categories: catsFromProps,
  } = props

  const [results, setResults] = useState<Result>({
    totalDocs: typeof populatedDocsTotal === 'number' ? populatedDocsTotal : 0,
    docs: populatedDocs?.map(doc => doc.value) || [],
    page: 1,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: 1,
    nextPage: 1,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasHydrated = useRef(false)

  // [page, categories] from query params
  // see the `RenderParams` component for more info
  const [params, setParams] = useState<(string | string[])[]>([])

  const scrollToRef = useCallback(() => {
    const { current } = scrollRef
    if (current) {
      // current.scrollIntoView({
      //   behavior: 'smooth',
      // })
    }
  }, [])

  useEffect(() => {
    const page = params[0]
    if (typeof page !== 'undefined') {
      // scrollToRef()
    }
  }, [isLoading, scrollToRef, params])

  useEffect(() => {
    // hydrate the block with fresh content after first render
    // don't show loader unless the request takes longer than x ms
    // and don't show it during initial hydration
    const timer: NodeJS.Timeout = setTimeout(() => {
      if (hasHydrated) {
        setIsLoading(true)
      }
    }, 500)

    const [page, catsFromQuery] = params

    const searchQuery = qs.stringify(
      {
        sort,
        where: {
          ...(catsFromProps && catsFromProps?.length > 0
            ? {
                categories: {
                  in:
                    typeof catsFromProps === 'string'
                      ? [catsFromProps]
                      : catsFromProps.map(cat => cat.id).join(','),
                },
              }
            : {}),
          ...(catsFromQuery?.length > 0
            ? {
                categories: {
                  in:
                    typeof catsFromQuery === 'string'
                      ? [catsFromQuery]
                      : catsFromQuery.map(cat => cat).join(','),
                },
              }
            : {}),
        },
        limit,
        page,
        depth: 1,
      },
      { encode: false },
    )

    const makeRequest = async () => {
      try {
        const req = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/${relationTo}?${searchQuery}`,
        )
        const json = await req.json()
        clearTimeout(timer)
        hasHydrated.current = true

        const { docs } = json as { docs: Product[] }

        if (docs && Array.isArray(docs)) {
          setResults(json)
          setIsLoading(false)
          if (typeof onResultChange === 'function') {
            onResultChange(json)
          }
        }
      } catch (err) {
        console.warn(err) // eslint-disable-line no-console
        setIsLoading(false)
        setError(`Unable to load "${relationTo} archive" data at this time.`)
      }
    }

    makeRequest()

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [params, catsFromProps, relationTo, onResultChange, sort, limit])

  return (
    <div className={[classes.collectionArchive, className].filter(Boolean).join(' ')}>
      {/* <RenderParams onParams={setParams} show={false} params={['page', 'categories']} /> */}
      <div ref={scrollRef} className={classes.scrollRef} />
      {!isLoading && error && <Gutter>{error}</Gutter>}
      <Fragment>
        {showPageRange !== false && (
          <Gutter>
            <div className={classes.pageRange}>
              <PageRange
                totalDocs={results.totalDocs}
                currentPage={results.page}
                collection={relationTo}
                limit={limit}
              />
            </div>
          </Gutter>
        )}
        <Gutter>
          <div className={classes.grid}>
            {results.docs?.map((result, index) => {
              return (
                <div key={index} className={classes.column}>
                  <Card relationTo="products" doc={result} showCategories />
                </div>
              )
            })}
          </div>
          {results.totalPages > 1 && (
            <Pagination
              className={classes.pagination}
              page={results.page}
              totalPages={results.totalPages}
              onClick={page => {
                setParams([page.toString(), params[1]])
              }}
            />
          )}
        </Gutter>
      </Fragment>
    </div>
  )
}
