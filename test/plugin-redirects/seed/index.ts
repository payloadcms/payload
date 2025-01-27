import type { Payload } from '../../../packages/payload/src'
import type { PayloadRequest } from '../../../packages/payload/types'

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data...')
  const req = {} as PayloadRequest

  try {
    await payload.create({
      collection: 'users',
      data: {
        email: 'demo@payloadcms.com',
        password: 'demo',
      },
      req,
    })

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
