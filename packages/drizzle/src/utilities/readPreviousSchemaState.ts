import type { Payload } from 'payload'

import fs from 'fs'
import path from 'path'

import type { DrizzleSnapshotJSON, RequireDrizzleKit } from '../types.js'

/**
 * Reads the schema state that the last migration left behind, from the snapshot (`.json`) files
 * in the migrations directory. Returns `undefined` when there are none.
 *
 * Snapshots are converted to the current drizzle-kit format in memory, so files written by older
 * versions keep working and are never rewritten. Postgres stores delta snapshots, so its state is
 * rebuilt from the whole folder; SQLite stores full states, so the newest file is the state.
 */
export const readPreviousSchemaState = async ({
  dir,
  kit,
  payload,
  shouldIncludeFile,
}: {
  dir: string
  kit: Awaited<ReturnType<RequireDrizzleKit>>
  payload: Payload
  /** Excludes JSON files that predefined migrations write next to the snapshots. */
  shouldIncludeFile?: (fileName: string) => boolean
}): Promise<DrizzleSnapshotJSON | undefined> => {
  if (!fs.existsSync(dir)) {
    return undefined
  }

  const files: Record<string, unknown> = {}

  for (const fileName of fs.readdirSync(dir).sort()) {
    if (!fileName.endsWith('.json') || (shouldIncludeFile && !shouldIncludeFile(fileName))) {
      continue
    }

    const contents: unknown = JSON.parse(fs.readFileSync(path.join(dir, fileName), 'utf8'))

    if (isSnapshot(contents)) {
      files[fileName] = contents
    }
  }

  const fileNames = Object.keys(files)

  if (!fileNames.length) {
    return undefined
  }

  const { snapshots } = await kit.upSnapshots(files)

  if (!kit.reconstruct) {
    return snapshots[fileNames.at(-1)!]
  }

  return kit.reconstruct(snapshots, getLatestLeafID({ fileNames, payload, snapshots }))
}

/**
 * A folder has one leaf per line of history. Migrations created on separate branches leave
 * several, which drizzle-kit can't combine through its API, so build on the newest one.
 */
const getLatestLeafID = ({
  fileNames,
  payload,
  snapshots,
}: {
  fileNames: string[]
  payload: Payload
  snapshots: Record<string, DrizzleSnapshotJSON>
}): string => {
  const parentIDs = new Set(fileNames.flatMap((fileName) => snapshots[fileName].prevIds ?? []))
  const leaves = fileNames.filter((fileName) => !parentIDs.has(snapshots[fileName].id))
  const latestLeaf = leaves.at(-1) ?? fileNames.at(-1)!

  if (leaves.length > 1) {
    payload.logger.warn(
      `Migrations ${leaves.join(', ')} were created on separate branches. The new migration is ` +
        `based on ${latestLeaf}, so review it for changes the other branches already made.`,
    )
  }

  return snapshots[latestLeaf].id
}

const isSnapshot = (value: unknown): boolean =>
  !!value && typeof value === 'object' && 'dialect' in value && 'id' in value
