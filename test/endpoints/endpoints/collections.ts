import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

export const collectionEndpoints: CollectionConfig['endpoints'] = [
  {
    path: '/say-hello/joe-bloggs',
    method: 'get',
    handler: () => {
      return Response.json({ message: 'Hey Joey!' })
    },
  },
  {
    path: '/say-hello/:group/:name',
    method: 'get',
    handler: ({ routeParams }) => {
      return Response.json({ message: `Hello ${routeParams.name} @ ${routeParams.group}` })
    },
  },
  {
    path: '/say-hello/:name',
    method: 'get',
    handler: ({ routeParams }) => {
      return Response.json({ message: `Hello ${routeParams.name}!` })
    },
  },
  {
    path: '/whoami',
    method: 'post',
    handler: ({ req }) => {
      return Response.json({
        name: req.data.name,
        age: req.data.age,
      })
    },
  },
]
