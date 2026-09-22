/** Minimal `fetch` surface we depend on, so tests can inject a fake without DOM types. */
export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<{ json: () => Promise<unknown>; ok: boolean }>

/** The slice of an npm packument we use: each version's declared dependencies plus dist-tags. */
export type Packument = {
  distTags: Record<string, string>
  versions: Record<string, { dependencies: Record<string, string> }>
}

export type RegistryClient = {
  /** Resolves a package's packument, or null when it is missing/unreachable/malformed. */
  fetchPackument: (name: string) => Promise<null | Packument>
}

const DEFAULT_REGISTRY = 'https://registry.npmjs.org'
// Abbreviated packument: smaller payload that still carries per-version dependencies.
const ABBREVIATED = 'application/vnd.npm.install-v1+json'

/**
 * Builds a packument fetcher that caches per package name (as an in-flight promise,
 * so concurrent callers share one request). Never throws: any failure resolves to
 * null, which the trace treats as "fix availability unknown" rather than "no fix".
 */
export const createRegistryClient = ({
  fetchImpl = (url, init) => fetch(url, init),
  registryUrl = DEFAULT_REGISTRY,
}: {
  fetchImpl?: FetchLike
  registryUrl?: string
} = {}): RegistryClient => {
  const cache = new Map<string, Promise<null | Packument>>()

  const fetchPackument = (name: string): Promise<null | Packument> => {
    const cached = cache.get(name)
    if (cached) {
      return cached
    }
    const pending = load({ fetchImpl, name, registryUrl }).catch(() => null)
    cache.set(name, pending)
    return pending
  }

  return { fetchPackument }
}

const load = async ({
  fetchImpl,
  name,
  registryUrl,
}: {
  fetchImpl: FetchLike
  name: string
  registryUrl: string
}): Promise<null | Packument> => {
  // Scoped names must keep their `@` but encode the slash for the registry path.
  const path = name.replace('/', '%2F')
  const response = await fetchImpl(`${registryUrl}/${path}`, { headers: { accept: ABBREVIATED } })
  if (!response.ok) {
    return null
  }
  return toPackument(await response.json())
}

const toPackument = (data: unknown): null | Packument => {
  if (!isRecord(data) || !isRecord(data.versions)) {
    return null
  }

  const versions: Packument['versions'] = {}
  for (const [version, info] of Object.entries(data.versions)) {
    versions[version] = { dependencies: isRecord(info) ? toStringRecord(info.dependencies) : {} }
  }

  const distTags = isRecord(data['dist-tags']) ? toStringRecord(data['dist-tags']) : {}
  return { distTags, versions }
}

const toStringRecord = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) {
    return {}
  }
  const result: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      result[key] = entry
    }
  }
  return result
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
