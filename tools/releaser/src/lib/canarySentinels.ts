import type { getDistTag, isVersionPublished } from './getPackageRegistryVersions.js'
import type { getProvenanceCommit } from './getProvenanceCommit.js'

export type CanaryRegistry = {
  getDistTag: typeof getDistTag
  getProvenanceCommit: typeof getProvenanceCommit
  isVersionPublished: typeof isVersionPublished
}

/**
 * Short names of the packages that stand for the whole canary publish. First and last
 * cover the set only because `runPublishSequence` publishes in list order and stops at
 * the first failure; `payload` is the package users install.
 */
export const getCanarySentinelShortNames = ({
  publishList,
}: {
  publishList: readonly string[]
}): string[] => {
  const candidates = [publishList[0], 'payload', publishList.at(-1)]
  return [...new Set(candidates.filter((name): name is string => typeof name === 'string'))]
}

/**
 * True only when every sentinel's `canary` dist-tag is the same version, built from
 * `head`. Equal versions catch a partial re-run of the same commit on a later day.
 * Missing data or a registry error returns false: an extra canary costs less than a
 * missed one.
 */
export const isCanaryAtHead = async ({
  head,
  log,
  registry,
  sentinelNames,
}: {
  head: string
  log: (message: string) => void
  registry: Pick<CanaryRegistry, 'getDistTag' | 'getProvenanceCommit'>
  sentinelNames: string[]
}): Promise<boolean> => {
  const checks = await Promise.all(
    sentinelNames.map(async (name): Promise<{ canaryVersion?: string; reason?: string }> => {
      try {
        const canaryVersion = await registry.getDistTag({ name, tag: 'canary' })
        if (!canaryVersion) {
          return { reason: `${name} has no canary dist-tag` }
        }
        const commit = await registry.getProvenanceCommit({ name, version: canaryVersion })
        if (commit !== head) {
          return {
            canaryVersion,
            reason: `${name}@${canaryVersion} was built from ${commit ?? 'an unknown commit'}`,
          }
        }
        return { canaryVersion }
      } catch (err: unknown) {
        return {
          reason: `${name} registry check failed: ${err instanceof Error ? err.message : String(err)}`,
        }
      }
    }),
  )

  const reasons = checks
    .map((check) => check.reason)
    .filter((reason): reason is string => reason !== undefined)
  const canaryVersions = new Set(
    checks
      .map((check) => check.canaryVersion)
      .filter((canaryVersion): canaryVersion is string => canaryVersion !== undefined),
  )
  if (canaryVersions.size > 1) {
    reasons.push(`sentinel canary versions differ: ${[...canaryVersions].join(', ')}`)
  }
  for (const reason of reasons) {
    log(`Canary is not at ${head}: ${reason}`)
  }
  return reasons.length === 0
}

/**
 * Fails when a sentinel already has `version` from a commit other than `head`. A version
 * from `head` is a re-run of a partial publish and may resume. Registry errors propagate.
 */
export const assertCanaryVersionFromHead = async ({
  head,
  registry,
  sentinelNames,
  version,
}: {
  head: string
  registry: Pick<CanaryRegistry, 'getProvenanceCommit' | 'isVersionPublished'>
  sentinelNames: string[]
  version: string
}): Promise<void> => {
  await Promise.all(
    sentinelNames.map(async (name) => {
      if (!(await registry.isVersionPublished({ name, version }))) {
        return
      }
      const commit = await registry.getProvenanceCommit({ name, version })
      if (commit !== head) {
        throw new Error(
          `${version} already published from ${commit ?? 'an unknown commit'} (${name}); one canary per UTC day`,
        )
      }
    }),
  )
}
