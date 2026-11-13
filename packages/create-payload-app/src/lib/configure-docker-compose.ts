import fse from 'fs-extra'
import path from 'path'
import {
  type Document,
  isMap,
  isPair,
  isScalar,
  isSeq,
  parseDocument,
  Scalar,
  type YAMLMap,
} from 'yaml'

import type { DbDetails, DbType } from '../types.js'

import { debug } from '../utils/log.js'

type DbService = {
  /** Port the database listens on inside its container */
  containerPort: number
  /** docker compose service definition */
  definition: (args: {
    dbName: string
    dbPassword?: string
    dbUser?: string
    hostPort: number
  }) => Record<string, unknown>
  name: string
  /** Named volume that stores the data */
  volume: string
}

/**
 * Database ports are only published on the loopback interface. The databases are meant for local
 * development, and MongoDB runs without authentication.
 */
const publishLocally = (hostPort: number, containerPort: number) =>
  `127.0.0.1:${hostPort}:${containerPort}`

/* eslint-disable perfectionist/sort-objects -- the key order is the order in docker-compose.yml */
const mongoService: DbService = {
  name: 'mongo',
  containerPort: 27017,
  definition: ({ hostPort }) => ({
    image: 'mongo:latest',
    ports: [publishLocally(hostPort, 27017)],
    command: ['--storageEngine=wiredTiger'],
    volumes: ['data:/data/db'],
    logging: { driver: 'none' },
  }),
  volume: 'data',
}

const postgresService: DbService = {
  name: 'postgres',
  containerPort: 5432,
  definition: ({ dbName, dbPassword, dbUser, hostPort }) => ({
    restart: 'always',
    image: 'postgres:latest',
    volumes: ['pgdata:/var/lib/postgresql'],
    ports: [publishLocally(hostPort, 5432)],
    environment: {
      POSTGRES_USER: dbUser || 'postgres',
      POSTGRES_DB: dbName,
      // Use the password of the connection string, only allow connecting without one when it has none
      ...(dbPassword ? { POSTGRES_PASSWORD: dbPassword } : { POSTGRES_HOST_AUTH_METHOD: 'trust' }),
    },
  }),
  volume: 'pgdata',
}
/* eslint-enable perfectionist/sort-objects */

const dbServices: Partial<Record<DbType, DbService>> = {
  mongodb: mongoService,
  postgres: postgresService,
  'vercel-postgres': postgresService,
}

/** All database services a template may contain, these are replaced by the selected one */
const knownDbServices = [mongoService, postgresService]

/** The service that runs Payload in the templates */
const APP_SERVICE = 'payload'

const LOCAL_HOSTNAMES = ['127.0.0.1', '0.0.0.0', '[::1]', 'localhost']

/** Matches `scheme://[userinfo@]` and captures the `host[:port]` that follows it */
const AUTHORITY_REGEX = /^([a-z][\d+.a-z-]*:\/\/(?:[^/?#@]*@)?)([^/?#]+)/i

type ParsedDbUri = {
  dbName?: string
  dbPassword?: string
  dbUser?: string
  isLocal: boolean
  port?: number
}

function parseDbUri(dbUri: string): ParsedDbUri | undefined {
  try {
    const url = new URL(dbUri)
    return {
      dbName: decodeURIComponent(url.pathname.replace(/^\//, '')) || undefined,
      dbPassword: decodeURIComponent(url.password) || undefined,
      dbUser: decodeURIComponent(url.username) || undefined,
      isLocal: LOCAL_HOSTNAMES.includes(url.hostname),
      port: url.port ? Number(url.port) : undefined,
    }
  } catch {
    return undefined
  }
}

/** Points a connection string at a docker compose service, keeping credentials, database name and options */
function toServiceUri(dbUri: string, service: DbService): string {
  return dbUri.replace(AUTHORITY_REGEX, `$1${service.name}:${service.containerPort}`)
}

/** Removes matching items from a sequence */
function removeFromSeq(doc: Document, seqPath: string[], matches: (item: string) => boolean): void {
  const seq = doc.getIn(seqPath)
  if (isSeq(seq)) {
    seq.items = seq.items.filter((item) => !matches(String(isScalar(item) ? item.value : item)))
  }
}

/** Creates a service node, with port mappings quoted like in the templates */
function createServiceNode(doc: Document, definition: Record<string, unknown>): YAMLMap {
  const node = doc.createNode(definition) as YAMLMap
  const ports = node.get('ports')

  if (isSeq(ports)) {
    for (const port of ports.items) {
      if (isScalar(port)) {
        port.type = Scalar.QUOTE_SINGLE
      }
    }
  }

  return node
}

/** Sets an environment variable of a service, supporting both the map and the list syntax */
function setServiceEnv(args: {
  comment?: string
  doc: Document
  name: string
  servicePath: string[]
  value: string
}): void {
  const { name, comment, doc, servicePath, value } = args
  const envPath = [...servicePath, 'environment']
  const environment = doc.getIn(envPath)

  if (isSeq(environment)) {
    removeFromSeq(doc, envPath, (item) => item.startsWith(`${name}=`))
    doc.addIn(envPath, `${name}=${value}`)
    return
  }

  if (!isMap(environment)) {
    doc.setIn(envPath, doc.createNode({}))
  }

  const key = doc.createNode(name)
  key.commentBefore = comment
  doc.deleteIn([...envPath, name])
  doc.addIn(envPath, doc.createPair(key, value))
}

/** Clears the trailing comment of a collection, and of the values it contains */
function clearTrailingComments(node: unknown): void {
  if (!isMap(node) && !isSeq(node)) {
    return
  }

  node.comment = null

  for (const item of node.items) {
    const value = isPair(item) ? item.value : item
    if (isScalar(value)) {
      value.comment = null
    }
  }
}

/**
 * Puts an empty line before the top-level `volumes`, but not between its entries. Empty lines
 * move around when the comments between them are removed.
 */
function normalizeVolumesSpacing(doc: Document): void {
  if (!isMap(doc.contents)) {
    return
  }

  for (const pair of doc.contents.items) {
    if (!isScalar(pair.key) || pair.key.value !== 'volumes') {
      continue
    }

    pair.key.spaceBefore = true

    if (isMap(pair.value)) {
      for (const volume of pair.value.items) {
        if (isScalar(volume.key)) {
          volume.key.spaceBefore = false
        }
      }
    }
  }
}

/** Removes a map or sequence when it has no items left */
function deleteIfEmpty(doc: Document, collectionPath: string[]): void {
  const collection = doc.getIn(collectionPath)
  if ((isMap(collection) || isSeq(collection)) && collection.items.length === 0) {
    doc.deleteIn(collectionPath)
  }
}

/**
 * Updates the template's docker-compose.yml for the selected database, similar to Rails'
 * `db:system:change`: removes the database services the template contains, then adds the
 * service of the selected database when it runs on this machine. The `payload` service of the
 * template is kept, apart from its `depends_on` and the connection string it uses inside docker.
 */
export function updateDockerCompose(args: { dbDetails: DbDetails; template: string }): string {
  const { dbDetails, template } = args

  const doc = parseDocument(template)
  const appServicePath = ['services', APP_SERVICE]
  const dependsOnPath = [...appServicePath, 'depends_on']
  const hasAppService = isMap(doc.getIn(appServicePath))

  // Templates explain how to switch databases in trailing comments, like a commented out postgres
  // service. Those no longer apply once the database is configured.
  clearTrailingComments(doc.get('services'))
  clearTrailingComments(doc.getIn(dependsOnPath))
  clearTrailingComments(doc.get('volumes'))

  for (const service of knownDbServices) {
    doc.deleteIn(['services', service.name])
    doc.deleteIn(['volumes', service.volume])
    removeFromSeq(doc, dependsOnPath, (item) => item === service.name)
  }

  const parsedUri = dbDetails.dbUri ? parseDbUri(dbDetails.dbUri) : undefined
  // Only run the database in docker when the connection string points to this machine
  const isLocalDb = !parsedUri || parsedUri.isLocal
  const dbService = isLocalDb ? dbServices[dbDetails.type] : undefined

  if (dbService) {
    const definition = dbService.definition({
      dbName: parsedUri?.dbName || 'payload',
      dbPassword: parsedUri?.dbPassword,
      dbUser: parsedUri?.dbUser,
      hostPort: parsedUri?.port ?? dbService.containerPort,
    })

    // An empty line separates the database service from the payload service
    const serviceKey = doc.createNode(dbService.name)
    serviceKey.spaceBefore = true
    doc.addIn(['services'], doc.createPair(serviceKey, createServiceNode(doc, definition)))
    doc.setIn(['volumes', dbService.volume], null)

    if (hasAppService) {
      if (isSeq(doc.getIn(dependsOnPath))) {
        doc.addIn(dependsOnPath, dbService.name)
      } else {
        doc.setIn(dependsOnPath, doc.createNode([dbService.name]))
      }

      if (dbDetails.dbUri && parsedUri) {
        setServiceEnv({
          name: dbDetails.type === 'vercel-postgres' ? 'POSTGRES_URL' : 'DATABASE_URL',
          comment: ' Inside docker the database is reachable by its service name, not 127.0.0.1',
          doc,
          servicePath: appServicePath,
          value: toServiceUri(dbDetails.dbUri, dbService),
        })
      }
    }
  }

  deleteIfEmpty(doc, dependsOnPath)
  deleteIfEmpty(doc, ['volumes'])
  normalizeVolumesSpacing(doc)

  // lineWidth 0 keeps long lines, like the `command`, on one line
  return doc.toString({ lineWidth: 0, nullStr: '' })
}

/**
 * Templates ship a docker-compose.yml for MongoDB. Updates it to match the selected database:
 * a MongoDB or Postgres service when the database runs on this machine, no database service for
 * SQLite or a remote database, and no docker-compose.yml at all for Cloudflare D1.
 */
export async function configureDockerCompose(args: {
  dbDetails?: DbDetails
  debug?: boolean
  projectDir: string
}): Promise<void> {
  const { dbDetails, projectDir } = args

  const composePath = path.resolve(projectDir, 'docker-compose.yml')

  if (!dbDetails || !(await fse.pathExists(composePath))) {
    return
  }

  if (dbDetails.type === 'd1-sqlite') {
    await fse.remove(composePath)
    if (args.debug) {
      debug('Removed docker-compose.yml, Cloudflare D1 runs through Wrangler')
    }
    return
  }

  const template = await fse.readFile(composePath, 'utf8')
  await fse.writeFile(composePath, updateDockerCompose({ dbDetails, template }))

  if (args.debug) {
    debug(`Configured docker-compose.yml for ${dbDetails.type}`)
  }
}
