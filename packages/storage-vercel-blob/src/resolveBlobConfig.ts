interface ResolveBlobConfigArgs {
  access: 'public'
  /** The `enabled` plugin option (defaults to true when undefined). */
  enabled?: boolean
  /** The `STORAGE_VERCEL_BLOB_BASE_URL` env override, if set (emulator support). */
  envBaseUrl?: string
  /** The `BLOB_STORE_ID` environment variable, if set (Vercel OIDC). */
  envStoreId?: string
  /** The explicit `storeId` plugin option, if provided. */
  storeId?: string
  /** The read/write `token` plugin option, if provided. */
  token?: string
}

interface ResolvedBlobConfig {
  /** The base URL used to construct public blob URLs. */
  baseUrl: string
  /** Whether the plugin should be disabled (fall back to local storage). */
  isPluginDisabled: boolean
  /** The resolved store ID (undefined when only the base-URL override is set). */
  storeId?: string
}

/**
 * Strip the optional `store_` prefix from a store ID, matching the
 * @vercel/blob SDK's own normalization.
 */
export function normalizeStoreId(value: string): string {
  return value.startsWith('store_') ? value.slice('store_'.length) : value
}

/**
 * Extract the store ID embedded in a read/write token, or `undefined` if the
 * token does not match the expected `vercel_blob_rw_<store_id>_<random>` shape.
 */
export function parseStoreIdFromToken(token: string): string | undefined {
  return token.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase()
}

/**
 * Resolve the Vercel Blob adapter's store ID, base URL, and enabled state.
 *
 * Store-ID precedence mirrors the @vercel/blob SDK's credential resolution:
 *   1. The read/write token (the store ID is embedded in it).
 *   2. The explicit `storeId` plugin option.
 *   3. The `BLOB_STORE_ID` environment variable (set by Vercel for OIDC).
 *
 * When no token is supplied the adapter runs in OIDC mode: @vercel/blob
 * resolves short-lived credentials from the environment, and the store ID is
 * used only to construct public blob URLs.
 *
 * The plugin disables itself (falling back to local storage) when it is
 * explicitly disabled, or when it can neither resolve a store ID nor use the
 * base-URL override.
 *
 * @throws if a token is provided but is malformed (and the plugin is active).
 */
export function resolveBlobConfig({
  access,
  enabled,
  envBaseUrl,
  envStoreId,
  storeId,
  token,
}: ResolveBlobConfigArgs): ResolvedBlobConfig {
  const storeIdFromToken = token ? parseStoreIdFromToken(token) : undefined

  const resolvedStoreId =
    storeIdFromToken ??
    (storeId ? normalizeStoreId(storeId) : undefined) ??
    (envStoreId ? normalizeStoreId(envStoreId) : undefined)

  const hasBaseUrlOverride = Boolean(envBaseUrl)

  const isPluginDisabled = enabled === false || (!resolvedStoreId && !hasBaseUrlOverride)

  // A provided-but-malformed token is a configuration error, surfaced only
  // when the plugin would otherwise be active.
  if (token && !storeIdFromToken && !isPluginDisabled) {
    throw new Error(
      'Invalid token format for Vercel Blob adapter. Should be vercel_blob_rw_<store_id>_<random_string>.',
    )
  }

  // support overriding the base URL for emulator https://github.com/payloadcms/vercel-blob-emulator
  const baseUrl = envBaseUrl || `https://${resolvedStoreId}.${access}.blob.vercel-storage.com`

  return { baseUrl, isPluginDisabled, storeId: resolvedStoreId }
}
