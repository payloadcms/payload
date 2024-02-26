import { execSync } from 'child_process'
import Conf from 'conf'
import { randomBytes } from 'crypto'
import findUp from 'find-up'
import fs from 'fs'

import type { Payload } from '../../types'
import type { AdminInitEvent } from './events/adminInit'
import type { ServerInitEvent } from './events/serverInit'

import { oneWayHash } from './oneWayHash'

export type BaseEvent = {
  envID: string
  nodeEnv: string
  nodeVersion: string
  payloadVersion: string
  projectID: string
}

type PackageJSON = {
  dependencies: Record<string, string | undefined>
  name: string
}

type TelemetryEvent = AdminInitEvent | ServerInitEvent

type Args = {
  event: TelemetryEvent
  payload: Payload
}

export const sendEvent = async ({ event, payload }: Args): Promise<void> => {
  if (payload.config.telemetry !== false) {
    try {
      const packageJSON = await getPackageJSON()

      const baseEvent: BaseEvent = {
        envID: getEnvID(),
        nodeEnv: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        payloadVersion: getPayloadVersion(packageJSON),
        projectID: getProjectID(payload, packageJSON),
      }

      await fetch('https://telemetry.payloadcms.com/events', {
        body: JSON.stringify({ ...baseEvent, ...event }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'post',
      })
    } catch (_) {
      // Eat any errors in sending telemetry event
    }
  }
}

/**
 * This is a quasi-persistent identifier used to dedupe recurring events. It's
 * generated from random data and completely anonymous.
 */
const getEnvID = (): string => {
  const conf = new Conf()
  const ENV_ID = 'envID'

  const val = conf.get(ENV_ID)
  if (val) {
    return val as string
  }

  const generated = randomBytes(32).toString('hex')
  conf.set(ENV_ID, generated)
  return generated
}

const getProjectID = (payload: Payload, packageJSON: PackageJSON): string => {
  const projectID =
    getGitID(payload) ||
    getPackageJSONID(payload, packageJSON) ||
    payload.config.serverURL ||
    process.cwd()
  return oneWayHash(projectID, payload.secret)
}

const getGitID = (payload: Payload) => {
  try {
    const originBuffer = execSync('git config --local --get remote.origin.url', {
      stdio: 'pipe',
      timeout: 1000,
    })

    return oneWayHash(String(originBuffer).trim(), payload.secret)
  } catch (_) {
    return null
  }
}

const getPackageJSON = async (): Promise<PackageJSON> => {
  const [rootDir] = __dirname.split('/.next/')
  const packageJsonPath = await findUp('package.json', { cwd: rootDir })
  const jsonContent: PackageJSON = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  return jsonContent
}

const getPackageJSONID = (payload: Payload, packageJSON: PackageJSON): string => {
  return oneWayHash(packageJSON.name, payload.secret)
}

export const getPayloadVersion = (packageJSON: PackageJSON): string => {
  return packageJSON?.dependencies?.payload ?? ''
}
