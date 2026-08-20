import type { Config } from './types.js'

import { InvalidConfiguration } from '../errors/index.js'

const REMOVED_UPLOAD_FIELDS = [
  'constructorOptions',
  'formatOptions',
  'resizeOptions',
  'trimOptions',
  'withMetadata',
]

const MIGRATION_HINT =
  'Run `npx @payloadcms/codemod --transform migrate-sharp-to-transformer` to migrate automatically, or see https://payloadcms.com/docs/upload/transformers.'

/**
 * Payload 4.0 removed the top-level `sharp` config option and the Sharp-specific
 * per-collection `upload` options in favor of `@payloadcms/transformer-sharp`
 * registered under `upload.transformers`. Neither removal is caught by the type
 * system for JavaScript configs or configs built from untyped data, so without
 * this check an app upgrading from 3.x would boot with no indication that image
 * resizing had stopped.
 */
export function assertNoLegacySharpConfig({ config }: { config: Config }): void {
  if ('sharp' in config) {
    throw new InvalidConfiguration(
      `The top-level \`sharp\` config option was removed in Payload 4.0. ${MIGRATION_HINT}`,
    )
  }

  for (const collection of config.collections ?? []) {
    const upload = collection.upload
    if (typeof upload !== 'object' || !upload) {
      continue
    }

    const removedField = REMOVED_UPLOAD_FIELDS.find((field) => field in upload)
    if (removedField) {
      throw new InvalidConfiguration(
        `Collection "${collection.slug}" uses the removed \`upload.${removedField}\` option. ${MIGRATION_HINT}`,
      )
    }
  }
}
