import type { ImportMap, SanitizedConfig } from 'payload'

import { renderServerComponent } from '@tanstack/react-start/rsc'

import { getLayoutData } from '../layouts/Root/getLayoutData.js'
import { toSerializable } from './toSerializable.js'

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
}): Promise<Record<string, unknown>> {
  const { providers, ...data } = await getLayoutData({ configPromise: config, importMap })

  return {
    ...(toSerializable(data) as Record<string, unknown>),
    providers: providers ? await renderServerComponent(providers as any) : undefined,
  }
}
