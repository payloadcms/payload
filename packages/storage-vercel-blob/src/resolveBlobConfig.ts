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
  /** The resolved store ID (undefined when none could be resolved). */
  storeId?: string
}

/**
 * Trim surrounding whitespace and strip the optional `store_` prefix from a
 * store ID, matching the @vercel/blob SDK's own normalization. The SDK trims
 * both an explicit `storeId` and `BLOB_STORE_ID` before authenticating, so the
 * adapter must too; otherwise it would build blob URLs with whitespace in the
 * hostname for a store the SDK authenticated successfully.
 */
export function normalizeStoreId(value: string): string {
  const trimmed = value.trim()
  return trimmed.startsWith('store_') ? trimmed.slice('store_'.length) : trimmed
}

/**
 * Normalize an optional store ID, treating a missing or blank value as unset
 * (the SDK ignores blank values too), so a blank `storeId` option still falls
 * through to `BLOB_STORE_ID`.
 */
function cleanStoreId(value: string | undefined): string | undefined {
  return (value ? normalizeStoreId(value) : '') || undefined
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
 * explicitly disabled, or when no store ID can be resolved. The base-URL
 * override alone does not count: it changes where URLs point, not whether the
 * SDK can authenticate.
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

  const resolvedStoreId = storeIdFromToken ?? cleanStoreId(storeId) ?? cleanStoreId(envStoreId)

  // The base-URL override only redirects where blob URLs point (e.g. at the
  // vercel-blob-emulator, which is still configured with a vercel_blob_rw_*
  // token). It is not a credential, so it never enables the plugin on its own:
  // without a resolvable store ID the SDK cannot authenticate, and uploads,
  // deletes and reads would fail at runtime instead of falling back to local
  // storage.
  const isPluginDisabled = enabled === false || !resolvedStoreId

  // A provided-but-malformed token is a configuration error. Surface it
  // whenever the plugin is not explicitly disabled, so a typo'd
  // BLOB_READ_WRITE_TOKEN fails loudly instead of silently falling back to
  // local storage (which would otherwise happen, because a malformed token
  // leaves no resolvable store ID and so marks the plugin disabled).
  if (token && !storeIdFromToken && enabled !== false) {
    throw new Error(
      'Invalid token format for Vercel Blob adapter. Should be vercel_blob_rw_<store_id>_<random_string>.',
    )
  }

  // support overriding the base URL for emulator https://github.com/payloadcms/vercel-blob-emulator
  const baseUrl = envBaseUrl || `https://${resolvedStoreId}.${access}.blob.vercel-storage.com`

  return { baseUrl, isPluginDisabled, storeId: resolvedStoreId }
}
