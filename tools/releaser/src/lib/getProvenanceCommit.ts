import { defaultSleep, fetchWithRetry } from './getPackageRegistryVersions.js'

const slsaPredicateType = 'https://slsa.dev/provenance/v1'

/**
 * Reads the git commit a published version was built from, via its npm provenance
 * attestation. `undefined` when the version has no provenance (404, no SLSA entry,
 * no commit); any other registry failure or an unreadable payload throws.
 */
export const getProvenanceCommit = async ({
  fetchImpl = fetch,
  name,
  sleep = defaultSleep,
  version,
}: {
  fetchImpl?: typeof fetch
  name: string
  sleep?: (ms: number) => Promise<void>
  version: string
}): Promise<string | undefined> => {
  const res = await fetchWithRetry({
    fetchImpl,
    sleep,
    url: `https://registry.npmjs.org/-/npm/v1/attestations/${name}@${version}`,
  })
  if (res.status === 404) {
    return undefined
  }
  if (!res.ok) {
    throw new Error(
      `Failed to read ${name}@${version} attestations from npm: ${res.status} ${res.statusText}`,
    )
  }

  const body: AttestationsResponse = await res.json()
  const encodedPayload = body.attestations?.find(
    (attestation) => attestation.predicateType === slsaPredicateType,
  )?.bundle?.dsseEnvelope?.payload
  if (!encodedPayload) {
    return undefined
  }

  const statement: SlsaStatement = JSON.parse(Buffer.from(encodedPayload, 'base64').toString())
  const gitCommit =
    statement.predicate?.buildDefinition?.resolvedDependencies?.[0]?.digest?.gitCommit
  return typeof gitCommit === 'string' ? gitCommit : undefined
}

type AttestationsResponse = {
  attestations?: {
    bundle?: { dsseEnvelope?: { payload?: string } }
    predicateType?: string
  }[]
}

type SlsaStatement = {
  predicate?: {
    buildDefinition?: {
      resolvedDependencies?: { digest?: { gitCommit?: unknown } }[]
    }
  }
}
