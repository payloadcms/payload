import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

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
    handler: (req) => {
      return Response.json({
        message: `Hello ${req.routeParams.name as string} @ ${req.routeParams.group as string}`,
      })
    },
  },
  {
    path: '/say-hello/:name',
    method: 'get',
    handler: (req) => {
      return Response.json({ message: `Hello ${req.routeParams.name as string}!` })
    },
  },
  {
    path: '/whoami',
    method: 'post',
    handler: (req) => {
      return Response.json({
        name: req.data.name,
        age: req.data.age,
      })
    },
  },
]
