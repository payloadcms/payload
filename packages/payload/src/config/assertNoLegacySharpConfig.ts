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
 *
 * This also catches the case where a collection still declares `upload.imageSizes`
 * but no transformer is registered to generate them: the config is otherwise
 * valid, so it would build without error while every upload skips size generation.
 *
 * Every violation is collected and reported together, since a config can have
 * more than one and fixing them one at a time would take multiple build attempts.
 */
export function assertNoLegacySharpConfig({ config }: { config: Config }): void {
  const errors: string[] = []

  if ('sharp' in config) {
    errors.push('The top-level `sharp` config option was removed in Payload 4.0.')
  }

  const hasTransformers =
    Array.isArray(config.upload?.transformers) && config.upload.transformers.length > 0

  for (const collection of config.collections ?? []) {
    const upload = collection.upload
    if (typeof upload !== 'object' || !upload) {
      continue
    }

    for (const field of REMOVED_UPLOAD_FIELDS) {
      if (field in upload) {
        errors.push(`Collection "${collection.slug}" uses the removed \`upload.${field}\` option.`)
      }
    }

    if (!hasTransformers && Array.isArray(upload.imageSizes) && upload.imageSizes.length > 0) {
      errors.push(
        `Collection "${collection.slug}" declares \`upload.imageSizes\` but no transformer is registered under \`upload.transformers\` to generate them.`,
      )
    }
  }

  if (errors.length > 0) {
    throw new InvalidConfiguration(`${errors.join(' ')} ${MIGRATION_HINT}`)
  }
}
