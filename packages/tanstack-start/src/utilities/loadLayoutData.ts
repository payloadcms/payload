import type { SerializableExtensions } from '@tanstack/react-router'
import type { ImportMap, SanitizedConfig } from 'payload'

import { renderServerComponent } from '@tanstack/react-start/rsc'

import { getLayoutData } from '../layouts/Root/getLayoutData.js'
import { toSerializable } from './toSerializable.js'

export type LoadLayoutDataResult = Record<string, unknown> &
  SerializableExtensions['TsrSerializable']

/**
 * Resolves the admin layout data for TanStack Start and returns a serializable
 * payload for the `/_payload` route loader. The framework adapter wraps this in
 * a `createServerFn` that supplies the app's `config` and generated `importMap`.
 *
 * `toSerializable` strips React elements, so the custom-providers element tree
 * (`config.admin.components.providers`) is rendered to an RSC payload separately
 * and re-attached.
 */
export async function loadLayoutData({
  config,
  importMap,
}: {
  config: SanitizedConfig
  importMap: ImportMap
}): Promise<LoadLayoutDataResult> {
  const { providers, ...data } = await getLayoutData({ configPromise: config, importMap })

  const result: Record<string, unknown> = {
    ...toSerializable(data),
    providers: providers ? await renderServerComponent(providers as any) : undefined,
  }

  return result as LoadLayoutDataResult
}
