import { strictObject } from '../../../utilities/zod.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { initializeMigration } from './initialize.js'

export const createMigrateUnlockCommand = defineCLICommand({
  description: 'Release a stuck migration lock.',
  handler: async ({ getPayload, isJSON }) => {
    const { payload } = await initializeMigration({ getPayload })

    try {
      const lock = await payload.findGlobal({
        slug: 'payload-migrations-lock',
        overrideAccess: true,
      })

      if (!lock.locked) {
        if (!isJSON) {
          payload.logger.info({ msg: 'Migration lock is not currently held' })
        }
        return { result: { unlocked: false } }
      }

      await payload.updateGlobal({
        slug: 'payload-migrations-lock',
        data: { locked: false },
        overrideAccess: true,
      })

      if (!isJSON) {
        payload.logger.info({
          msg: 'Migration lock forcibly released',
          was_locked_by: lock.locked_by,
        })
      }

      return { result: { unlocked: true } }
    } catch (err) {
      payload.logger.error({
        err,
        msg: 'Failed to unlock migrations. Lock global may not be initialized.',
      })
      throw err
    }
  },
  helpGroup: 'Migration commands',
  input: strictObject({}),
})
