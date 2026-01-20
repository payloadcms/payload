import { acceptDrizzlePrompts } from '@payloadcms/drizzle'
import { execSync, spawnSync } from 'child_process'
import { randomUUID } from 'crypto'
import { readFileSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath, pathToFileURL } from 'url'
import { beforeAll, beforeEach, expect } from 'vitest'

import { describe, it } from '../../helpers/vitest.js'
import config from './config.js'
import { addCollectionToConfig, deleteCollectionFromConfig } from './configSourceBuilder.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const executeCLI = (command: string) => {
  const result = spawnSync(
    'pnpm',
    ['tsx', path.resolve(dirname, '../../config/bin.ts'), ...command.split(' ')],
    {
      env: {
        ...process.env,
        PAYLOAD_DROP_DATABASE: 'false',
      },
      cwd: path.resolve(dirname, '../../..'), // from root
    },
  )

  return result
}

describe('Database Migrate Has Changes', { db: 'drizzle' }, () => {
  beforeAll(() => {
    process.env.PAYLOAD_DROP_DATABASE = 'false'
    process.env.PAYLOAD_CONFIG_PATH = path.join(dirname, 'config.ts')
  })

  it('should have changes when there are no migrations', async () => {
    rmSync(path.join(dirname, 'migrations'), { recursive: true, force: true })
    const payload = await getPayload({ config })

    await expect(payload.db.migrateHasChanges()).resolves.toBe(true)
  })

  it('should not have changes after initial migration was created', async () => {
    rmSync(path.join(dirname, 'migrations'), { recursive: true, force: true })
    const payload = await getPayload({ config })

    await payload.db.createMigration({ payload, migrationName: '_initial' })

    await expect(payload.db.migrateHasChanges()).resolves.toBe(false)
  })

  it('test bin', async () => {
    rmSync(path.join(dirname, 'migrations'), { recursive: true, force: true })
    const payload = await getPayload({ config })

    const res = executeCLI('migrate:has-changes')

    expect(res.status).toBe(0) // Should have changes as no migrations exist

    await payload.db.createMigration({ payload, migrationName: '_initial' })

    const res2 = executeCLI('migrate:has-changes')

    expect(res2.status).toBe(1) // Should not have changes after initial migration
  })

  // Only run this test when using the Drizzle adapter
  it('should have changes after adding a collection to the config', async () => {
    rmSync(path.join(dirname, 'migrations'), { recursive: true, force: true })
    rmSync(path.join(dirname, 'GENERATED_config.ts'), { force: true })
    rmSync(path.join(dirname, 'GENERATED_config_2.ts'), { force: true })
    const tempConfigPath = path.join(dirname, 'GENERATED_config.ts')

    const importTempConfig = async () => {
      const url = pathToFileURL(tempConfigPath).href
      const tempConfig = await import(`${url}?imported=${Date.now()}`)
      return tempConfig.default
    }

    {
      const payload = await getPayload({ config })

      await expect(payload.db.migrateHasChanges()).resolves.toBe(true)

      await payload.db.createMigration({ payload, migrationName: '_initial' })
      await wait(250)
      console.log('Initial migration created.')

      await expect(payload.db.migrateHasChanges()).resolves.toBe(false)

      writeFileSync(tempConfigPath, readFileSync(path.join(dirname, 'config.ts'), 'utf8'), {
        flag: 'w',
      })

      await payload.destroy()
    }

    console.log('Adding collection to config')

    addCollectionToConfig(tempConfigPath, 'comments')

    const getUpdatedPayloadInstance = async () => {
      await wait(500)
      const updatedConfig = await importTempConfig()
      const updatedPayload = await getPayload({ config: updatedConfig, key: randomUUID() })
      return updatedPayload
    }

    let modifiedPayload = await getUpdatedPayloadInstance()

    await expect(modifiedPayload.db.migrateHasChanges()).resolves.toBe(true)

    console.log('Creating migration for new collection...')
    await modifiedPayload.db.createMigration({
      payload: modifiedPayload,
      migrationName: '_added_comments',
    })
    await modifiedPayload.destroy()

    console.log('Checking for changes again...')

    modifiedPayload = await getUpdatedPayloadInstance()

    await expect(modifiedPayload.db.migrateHasChanges()).resolves.toBe(false)

    await modifiedPayload.destroy()

    console.log('Modifying existing collection schema...')

    deleteCollectionFromConfig(tempConfigPath, 'comments')
    addCollectionToConfig(tempConfigPath, 'others')
    addCollectionToConfig(tempConfigPath, 'comments')

    modifiedPayload = await getUpdatedPayloadInstance()

    await expect(modifiedPayload.db.migrateHasChanges()).resolves.toBe(true)

    console.log('Creating migration for modified collection...')

    await acceptDrizzlePrompts(() =>
      modifiedPayload.db.createMigration({
        payload: modifiedPayload,
        migrationName: '_added_others_and_comments_deleted_comments',
      }),
    )

    await modifiedPayload.destroy()

    console.log('Checking for changes again...')

    modifiedPayload = await getUpdatedPayloadInstance()

    await expect(modifiedPayload.db.migrateHasChanges()).resolves.toBe(false)

    await modifiedPayload.destroy()
  })
})
