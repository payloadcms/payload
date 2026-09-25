import semver from 'semver'

import type { FetchRegistry, ResolvedVersions } from './types.js'

import { TS_FLOOR } from './types.js'

type ResolveVersionsArgs = {
  fetchRegistry: FetchRegistry
  tag: string
}

/**
 * Resolve the v4 target version set from the registry. Reads payload's engines
 * and @payloadcms/next's peer range at their `tag` dist-tag, then picks the
 * newest satisfying patch for @types/node and next. `nextTarget` is report-only.
 */
export async function resolveVersions({
  fetchRegistry,
  tag,
}: ResolveVersionsArgs): Promise<ResolvedVersions> {
  const payloadDoc = await fetchRegistry('payload')
  const payloadVersion = payloadDoc['dist-tags']?.[tag]
  if (!payloadVersion) {
    throw new Error(`payload has no dist-tag "${tag}" on the npm registry.`)
  }

  const enginesNode = payloadDoc.versions?.[payloadVersion]?.engines?.node
  if (!enginesNode) {
    throw new Error(`payload@${payloadVersion} does not declare engines.node.`)
  }

  const typesNode = await newestWithinMajor(fetchRegistry, '@types/node', nodeMajor(enginesNode))
  const nextTarget = await resolveNextTarget(fetchRegistry, tag)

  return {
    enginesNode,
    nextTarget,
    payloadVersion,
    typescript: TS_FLOOR,
    typesNode,
  }
}

function nodeMajor(enginesNode: string): number {
  const min = semver.minVersion(enginesNode)
  if (!min) {
    throw new Error(`Could not parse a Node major from engines.node "${enginesNode}".`)
  }
  return min.major
}

async function newestWithinMajor(
  fetchRegistry: FetchRegistry,
  packageName: string,
  major: number,
): Promise<string> {
  const doc = await fetchRegistry(packageName)
  const versions = Object.keys(doc.versions ?? {})
  const range = `>=${major}.0.0 <${major + 1}.0.0`
  const best = semver.maxSatisfying(versions, range)
  if (!best) {
    throw new Error(`No ${packageName} version found within major ${major}.`)
  }
  return best
}

async function resolveNextTarget(
  fetchRegistry: FetchRegistry,
  tag: string,
): Promise<null | string> {
  const nextDoc = await fetchRegistry('@payloadcms/next')
  const version = nextDoc['dist-tags']?.[tag]
  const range = version ? nextDoc.versions?.[version]?.peerDependencies?.next : undefined
  if (!range) {
    return null
  }
  const versions = Object.keys((await fetchRegistry('next')).versions ?? {})
  return semver.maxSatisfying(versions, range)
}
