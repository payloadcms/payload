import type { ImportMap, SanitizedConfig } from 'payload'

import { renderServerComponent } from '@tanstack/react-start/rsc'

import { getLayoutData } from '../layouts/Root/getLayoutData.js'
import { toSerializable } from './toSerializable.js'

/** Plain JSON value. See `clientConfig` on {@link LoadLayoutDataResult}. */
type JSONSerializable =
  | { [key: string]: JSONSerializable }
  | boolean
  | JSONSerializable[]
  | null
  | number
  | string
  | undefined

/**
 * The serializable RSC handle returned by `renderServerComponent`, recognized
 * by TanStack's `createServerFn` return-type guard. See `loadAdminPage`.
 */
type RenderedRsc = Awaited<ReturnType<typeof renderServerComponent<React.ReactElement>>>

/**
 * Serializable layout payload returned to the `/_payload` route loader. Mirrors
 * `getLayoutData`'s result, with two fields re-typed so TanStack's serialization
 * guard accepts the wrapping `createServerFn`:
 * - `providers` is the rendered RSC handle, not the unrendered element tree.
 * - `clientConfig` is surfaced as plain JSON. `ClientConfig`'s static type
 *   carries deep `unknown`/function members (field schemas) that the guard
 *   rejects even though `toSerializable` strips them at runtime. The layout
 *   route reads it via loosely-typed `useLoaderData`, so the narrowing is inert.
 */
export type LoadLayoutDataResult = {
  clientConfig: JSONSerializable
  providers?: RenderedRsc
} & Omit<Awaited<ReturnType<typeof getLayoutData>>, 'clientConfig' | 'providers'>

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

  return {
    ...toSerializable(data),
    clientConfig: data.clientConfig as unknown as JSONSerializable,
    providers: providers ? await renderServerComponent(providers as any) : undefined,
  }
}
