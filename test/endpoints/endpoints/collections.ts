import type { CollectionConfig } from 'payload'

export const collectionEndpoints: CollectionConfig['endpoints'] = [
  {
    handler: () => {
      return Response.json({ message: 'Hey Joey!' })
    },
    method: 'get',
    path: '/say-hello/joe-bloggs',
  },
  {
    handler: (req) => {
      return Response.json({
        message: `Hello ${req.routeParams.name as string} @ ${req.routeParams.group as string}`,
      })
    },
    method: 'get',
    path: '/say-hello/:group/:name',
  },
  {
    handler: (req) => {
      return Response.json({ message: `Hello ${req.routeParams.name as string}!` })
    },
    method: 'get',
    path: '/say-hello/:name',
  },
  {
    handler: async (req) => {
      let data

      try {
        data = await req.json()
      } catch (error) {
        data = {}
      }

      if (data) req.data = data

      return Response.json({
        name: req.data.name,
        age: req.data.age,
      })
    },
    method: 'post',
    path: '/whoami',
  },
]
