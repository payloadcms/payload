/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-floating-promises */
'use client'
import { createPayloadClient, usePayloadQuery } from '@payloadcms/plugin-realtime'
import { usePayloadAPI } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

const { payloadQuery } = createPayloadClient()

export function PostCount() {
  const [{ data, isError, isLoading }, { setParams: _ }] = usePayloadAPI('/api/posts', {
    initialParams: { depth: 1 /** where: { title: { contains: 'Test' } } */ },
  })
  // const {
  //   data: data2,
  //   error,
  //   isLoading: isLoading2,
  // } = usePayloadQuery('count', { collection: 'posts' })
  const [count3, setCount3] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      const promiseCount = payloadQuery(
        'count',
        { collection: 'posts' },
        {
          onChange: (result) => {
            console.log('result', result)
            setCount3(result?.totalDocs)
          },
        },
      )
      // TODO: WHY DATA IS NEEDED HERE AND NOT IN THE ONCHANGE?
      const count = (await promiseCount)?.data?.totalDocs
      console.log('count', count)
      if (count && !count3) {
        console.log('no count')
        setCount3(count)
      }
      // payloadQuery('count', { collection: 'posts' }).then((result) => {
      //   if (result.data && typeof result.data?.totalDocs === 'number') {
      //     setCount3(result.data.totalDocs)
      //   }
      // })
    }
    fetchCount()
  }, [])

  if (isError) {
    return <div>Error</div>
  }
  if (isLoading) {
    return <div>Loading...</div>
  }
  console.log(data)
  // if (isLoading2) {
  //   return <div>Loading 2...</div>
  // }
  // if (error) {
  //   return <div>Error 2: {error.message}</div>
  // }
  // console.log(data2)
  return (
    <>
      <div>Posts count from REST API: {data?.totalDocs}</div>
      {/* <div>Posts count from reactive: {data2?.totalDocs}</div> */}
      <div>Posts count from reactive: {count3}</div>
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
