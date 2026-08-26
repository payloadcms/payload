/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupportedLanguages } from '@payloadcms/translations'

import type { ClientConfig } from '../config/client.js'
import type { InitOptions, SanitizedConfig } from '../config/types.js'
import type { FlattenedBlock } from '../fields/config/types.js'
import type { Payload } from '../index.js'

import { generateImportMap } from '../bin/generateImportMap/index.js'

/** @internal */
export const reload = async (
  config: SanitizedConfig,
  payload: Payload,
  skipImportMapGeneration?: boolean,
  options?: InitOptions,
): Promise<void> => {
  if (typeof payload.db.destroy === 'function') {
    // Only destroy db, as we then later only call payload.db.init and not payload.init
    await payload.db.destroy()
  }
  payload.config = config

  payload.collections = config.collections.reduce(
    (collections, collection) => {
      collections[collection.slug] = {
        config: collection,
        customIDType: payload.collections[collection.slug]?.customIDType,
      }
      return collections
    },
    {} as Record<string, any>,
  )

  payload.blocks = config.blocks.reduce(
    (blocks, block) => {
      blocks[block.slug] = block
      return blocks
    },
    {} as Record<string, FlattenedBlock>,
  )

  payload.globals = {
    config: config.globals,
  }

  // TODO: support HMR for other props in the future (see payload/src/index init()) that may change on Payload singleton

  // Generate types
  if (config.typescript.autoGenerate !== false) {
    // We cannot run it directly here, as generate-types imports json-schema-to-typescript, which breaks on turbopack.
    // see: https://github.com/vercel/next.js/issues/66723
    void payload.bin({
      args: ['generate:types'],
      log: false,
    })
  }

  // Generate import map
  if (skipImportMapGeneration !== true && config.admin?.importMap?.autoGenerate !== false) {
    // This may run outside of the admin panel, e.g. in the user's frontend, where we don't have an import map file.
    // We don't want to throw an error in this case, as it would break the user's frontend.
    // => just skip it => ignoreResolveError: true
    await generateImportMap(config, {
      ignoreResolveError: true,
      log: true,
    })
  }

  if (payload.db?.init) {
    await payload.db.init()
  }

  if (!options?.disableDBConnect && payload.db.connect) {
    await payload.db.connect({ hotReload: true })
  }

  ;(global as any)._payload_clientConfigs = {} as Record<keyof SupportedLanguages, ClientConfig>
  ;(global as any)._payload_schemaMap = null
  ;(global as any)._payload_clientSchemaMap = null
  ;(global as any)._payload_doNotCacheClientConfig = true // This will help refreshing the client config cache more reliably. If you remove this, please test HMR + client config refreshing (do new fields appear in the document?)
  ;(global as any)._payload_doNotCacheSchemaMap = true
  ;(global as any)._payload_doNotCacheClientSchemaMap = true
}
