import type { Config } from '../../config/types.js'
import type { Field, GlobalConfig } from '../../index.js'

import { ReservedFieldName } from '../../errors/index.js'
import { sanitizeGlobals } from './sanitize.js'

describe('reservedFieldNames - globals -', () => {
  const config = {
    collections: [],
    globals: [],
  } as Partial<Config>

  describe('versions -', () => {
    const globalConfigWithVersions: GlobalConfig = {
      slug: 'global-with-versions',
      fields: [],
      versions: true,
    }

    it('should throw on __v', async () => {
      const fields: Field[] = [
        {
          name: '__v',
          type: 'text',
          label: 'some-collection',
        },
      ]
      await expect(async () => {
        // @ts-expect-error
        await sanitizeGlobals({
          ...config,
          globals: [
            {
              ...globalConfigWithVersions,
              fields,
            },
          ],
        })
      }).rejects.toThrow(ReservedFieldName)
    })

    it('should throw on _status', async () => {
      const fields: Field[] = [
        {
          name: '_status',
          type: 'text',
          label: 'some-collection',
        },
      ]
      await expect(async () => {
        // @ts-expect-error
        await sanitizeGlobals({
          ...config,
          globals: [
            {
              ...globalConfigWithVersions,
              fields,
            },
          ],
        })
      }).rejects.toThrow(ReservedFieldName)
    })

    it('should not throw on custom field status', async () => {
      const fields: Field[] = [
        {
          name: 'status',
          type: 'text',
          label: 'some-collection',
        },
      ]
      await expect(async () => {
        // @ts-expect-error
        await sanitizeGlobals({
          ...config,
          globals: [
            {
              ...globalConfigWithVersions,
              fields,
            },
          ],
        })
      }).not.toThrow()
    })
  })
})
