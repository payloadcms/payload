import type { Response } from 'express'

import express from 'express'

import type { Config } from '../../src/config/types'
import type { PayloadRequest } from '../../src/express/types'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { openAccess } from '../helpers/configHelpers'

export const collectionSlug = 'endpoints'
export const globalSlug = 'global-endpoints'

export const globalEndpoint = 'global'
export const applicationEndpoint = 'path'
export const rootEndpoint = 'root'
export const noEndpointsCollectionSlug = 'no-endpoints'
export const noEndpointsGlobalSlug = 'global-no-endpoints'

const MyConfig: Config = {
  collections: [
    {
      slug: collectionSlug,
      access: openAccess,
      endpoints: [
        {
          path: '/say-hello/joe-bloggs',
          method: 'get',
          handler: (req: PayloadRequest, res: Response): void => {
            res.json({ message: 'Hey Joey!' })
          },
        },
        {
          path: '/say-hello/:group/:name',
          method: 'get',
          handler: (req: PayloadRequest, res: Response): void => {
            res.json({ message: `Hello ${req.params.name} @ ${req.params.group}` })
          },
        },
        {
          path: '/say-hello/:name',
          method: 'get',
          handler: (req: PayloadRequest, res: Response): void => {
            res.json({ message: `Hello ${req.params.name}!` })
          },
        },
        {
          path: '/whoami',
          method: 'post',
          handler: (req: PayloadRequest, res: Response): void => {
            res.json({
              name: req.body.name,
              age: req.body.age,
            })
          },
        },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      slug: noEndpointsCollectionSlug,
      graphQL: false,
      endpoints: false,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],
  globals: [
    {
      slug: globalSlug,
      endpoints: [
        {
          path: `/${globalEndpoint}`,
          method: 'post',
          handler: (req: PayloadRequest, res: Response): void => {
            res.json(req.body)
          },
        },
      ],
      fields: [],
    },
    {
      slug: noEndpointsGlobalSlug,
      graphQL: false,
      endpoints: false,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],
  endpoints: [
    {
      path: `/${applicationEndpoint}`,
      method: 'post',
      handler: (req: PayloadRequest, res: Response): void => {
        res.json(req.body)
      },
    },
    {
      path: `/${applicationEndpoint}`,
      method: 'get',
      handler: (req: PayloadRequest, res: Response): void => {
        res.json({ message: 'Hello, world!' })
      },
    },
    {
      path: `/${applicationEndpoint}/i18n`,
      method: 'get',
      handler: (req: PayloadRequest, res: Response): void => {
        res.json({ message: req.t('general:backToDashboard') })
      },
    },
    {
      path: `/${rootEndpoint}`,
      method: 'get',
      root: true,
      handler: (req: PayloadRequest, res: Response): void => {
        res.json({ message: 'Hello, world!' })
      },
    },
    {
      path: `/${rootEndpoint}`,
      method: 'post',
      root: true,
      handler: [
        express.json({ type: 'application/json' }),
        (req: PayloadRequest, res: Response): void => {
          res.json(req.body)
        },
      ],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
}

export default buildConfigWithDefaults(MyConfig)
