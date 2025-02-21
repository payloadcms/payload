/* eslint-disable @typescript-eslint/no-floating-promises */
'use client'
import {
  createPayloadClient,
  PayloadQueryClientProvider,
  usePayloadQuery,
} from '@payloadcms/plugin-realtime'
import { usePayloadAPI } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

const { payloadQuery } = createPayloadClient()

export function PostCount() {
  return (
    <PayloadQueryClientProvider>
      <PostCountChild />
    </PayloadQueryClientProvider>
  )
}

export function PostCountChild() {
  const { data, error, isLoading } = usePayloadQuery('count', { collection: 'posts' })

  const [{ data: data2, isError, isLoading: isLoading2 }, { setParams: _ }] = usePayloadAPI(
    '/api/posts',
    {
      initialParams: { depth: 1 /** where: { title: { contains: 'Test' } } */ },
    },
  )
  const [count3, setCount3] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      const promiseCount = payloadQuery(
        'count',
        { collection: 'posts' },
        {
          onChange: (result) => {
            if (result.data) {
              setCount3(result.data.totalDocs)
            }
          },
        },
      )
      const count = (await promiseCount)?.data?.totalDocs
      if (count && !count3) {
        setCount3(count)
      }
    }
    fetchCount()
  }, [])

  if (isError) {
    return <div>Error</div>
  }
  if (isLoading) {
    return <div>Loading...</div>
  }
  if (isLoading2) {
    return <div>Loading 2...</div>
  }
  if (error) {
    return <div>Error 2: {error.message}</div>
  }
  console.log(data2)
  return (
    <>
      <div>Posts count from REST API (usePayloadAPI): {data2?.totalDocs}</div>
      <div>Posts count from reactive (vanilla): {count3}</div>
      <div>Posts count from reactive (usePayloadQuery): {data?.totalDocs}</div>
      <button
        onClick={() => {
          // createPost()
          // We'll use the REST API instead:
          fetch('/api/posts', {
            body: JSON.stringify({ title: 'Test Post' }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })
        }}
        type="button"
      >
        Create Post
      </button>
    </>
  )
}
