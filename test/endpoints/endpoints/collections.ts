import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

export const collectionEndpoints: CollectionConfig['endpoints'] = [
  {
    path: '/say-hello/joe-bloggs',
    method: 'get',
    handler: () => {
      return Response.json({ message: 'Hey Joe!' })
    },
  },
  {
    path: '/say-hello/:group/:name',
    method: 'get',
    handler: ({ req }) => {
      const sp = new URL(req.url).searchParams
      return Response.json({ message: `Hello ${sp.get('name')} @ ${sp.get('group')}` })
    },
  },
  {
    path: '/say-hello/:name',
    method: 'get',
    handler: ({ req }) => {
      const sp = new URL(req.url).searchParams
      return Response.json({ message: `Hello ${sp.get('name')}!` })
    },
  },
  {
    path: '/whoami',
    method: 'post',
    handler: ({ req }) => {
      const sp = new URL(req.url).searchParams
      return Response.json({
        name: sp.get('name'),
        age: sp.get('age'),
      })
    },
  },
]
