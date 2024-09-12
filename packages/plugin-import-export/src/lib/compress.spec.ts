import type { Payload } from 'payload'

import { jest } from '@jest/globals'
import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { compress } from './compress.js'

describe('Compress', () => {
  const mockPayload = {
    find: jest.fn(() => {
      return {
        docs: [
          {
            id: '66e1fc1558f63accd6af32bb',
            collectionExports: [
              {
                slug: 'post',
                data: [
                  {
                    id: '66e1f8d9a53c7ca2cb8971b1',
                    _status: 'published',
                    createdAt: '2024-09-11T20:08:57.146Z',
                    myBlocks: [],
                    text: 'example post',
                    updatedAt: '2024-09-11T20:08:57.146Z',
                  },
                ],
              },
              {
                slug: 'users',
                data: [
                  {
                    id: '66e1f8d9a53c7ca2cb8971af',
                    createdAt: '2024-09-11T20:08:57.140Z',
                    email: 'dev@payloadcms.com',
                    loginAttempts: 0,
                    updatedAt: '2024-09-11T20:08:57.140Z',
                  },
                ],
              },
              // Global
              {
                slug: 'menu',
                data: {
                  id: '66e1f8d9a53c7ca2cb8971b0',
                  createdAt: '2024-09-11T20:08:57.139Z',
                  globalText: 'example global text',
                  updatedAt: '2024-09-11T20:08:57.139Z',
                },
              },
            ],
            createdAt: '2024-09-11T20:08:57.213Z',
            updatedAt: '2024-09-11T20:08:57.213Z',
          },
        ],
      }
    }),
    logger: {
      info: (args) => console.log(args),
    },
  } as unknown as Payload

  it('should create proper file tree', async () => {
    const res = await compress({
      destination: path.resolve(dirname, 'export'),
      payload: mockPayload,
    })
  })
})
