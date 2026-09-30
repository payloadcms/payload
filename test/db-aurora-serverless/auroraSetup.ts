import { CreateDBClusterCommand, DescribeDBClustersCommand, RDSClient } from '@aws-sdk/client-rds'
import {
  CreateSecretCommand,
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'

export type AuroraResources = {
  database: string
  endpoint: string
  region: string
  resourceArn: string
  secretArn: string
}

const DEFAULT_ENDPOINT = 'http://localhost:4566'
const CLUSTER_ID = 'payload-test'
const SECRET_NAME = 'payload-test/data-api'
const DATABASE = 'payload'
const MASTER_USERNAME = 'postgres'
const MASTER_PASSWORD = 'postgres'
const REGION = process.env.AURORA_REGION ?? 'us-east-1'

export const getAuroraEndpoint = (): string => process.env.AURORA_ENDPOINT ?? DEFAULT_ENDPOINT

/**
 * Probes floci's health endpoint. Returns false when the emulator is unreachable or the suite was
 * explicitly disabled, so the integration suite can skip cleanly instead of hanging.
 */
export const isFlociReachable = async (): Promise<boolean> => {
  if (process.env.RUN_AURORA_SERVERLESS_TESTS === 'false') {
    return false
  }

  try {
    const response = await fetch(`${getAuroraEndpoint()}/_floci/health`, {
      signal: AbortSignal.timeout(1500),
    })
    return response.ok
  } catch {
    return false
  }
}

let resourcesPromise: null | Promise<AuroraResources> = null

/**
 * Provisions (or reuses) the RDS cluster and Secrets Manager secret the RDS Data API needs. The
 * result is cached for the process lifetime and is idempotent across runs. Set
 * `AURORA_RESOURCE_ARN` / `AURORA_SECRET_ARN` to reuse resources provisioned out-of-band.
 */
export const ensureAuroraResources = (): Promise<AuroraResources> => {
  resourcesPromise ??= provisionAuroraResources()

  return resourcesPromise
}

const provisionAuroraResources = async (): Promise<AuroraResources> => {
  const endpoint = getAuroraEndpoint()
  const envResourceArn = process.env.AURORA_RESOURCE_ARN
  const envSecretArn = process.env.AURORA_SECRET_ARN

  if (envResourceArn && envSecretArn) {
    return {
      database: DATABASE,
      endpoint,
      region: REGION,
      resourceArn: envResourceArn,
      secretArn: envSecretArn,
    }
  }

  const rds = new RDSClient({ credentials: getCredentials(), endpoint, region: REGION })
  const secretsManager = new SecretsManagerClient({
    credentials: getCredentials(),
    endpoint,
    region: REGION,
  })

  const resourceArn = envResourceArn ?? (await ensureCluster(rds))
  const secretArn = envSecretArn ?? (await ensureSecret(secretsManager))

  return { database: DATABASE, endpoint, region: REGION, resourceArn, secretArn }
}

const getCredentials = () => ({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
})

const ensureCluster = async (rds: RDSClient): Promise<string> => {
  try {
    await rds.send(
      new CreateDBClusterCommand({
        DatabaseName: DATABASE,
        DBClusterIdentifier: CLUSTER_ID,
        Engine: 'aurora-postgresql',
        MasterUserPassword: MASTER_PASSWORD,
        MasterUsername: MASTER_USERNAME,
      }),
    )
  } catch (error) {
    if (!isAlreadyExists(error)) {
      throw error
    }
  }

  return waitForClusterArn(rds)
}

const waitForClusterArn = async (
  rds: RDSClient,
  attempts = 60,
  intervalMs = 1000,
): Promise<string> => {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const { DBClusters } = await rds.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: CLUSTER_ID }),
    )
    const cluster = DBClusters?.find((candidate) => candidate.DBClusterIdentifier === CLUSTER_ID)
    const isReady = cluster?.Status === undefined || cluster.Status === 'available'

    if (cluster?.DBClusterArn && isReady) {
      return cluster.DBClusterArn
    }

    await delay(intervalMs)
  }

  throw new Error(`Timed out waiting for RDS cluster "${CLUSTER_ID}" to become available.`)
}

const ensureSecret = async (secretsManager: SecretsManagerClient): Promise<string> => {
  try {
    await secretsManager.send(
      new CreateSecretCommand({
        Name: SECRET_NAME,
        SecretString: JSON.stringify({ password: MASTER_PASSWORD, username: MASTER_USERNAME }),
      }),
    )
  } catch (error) {
    if (!isAlreadyExists(error)) {
      throw error
    }
  }

  const { ARN } = await secretsManager.send(new DescribeSecretCommand({ SecretId: SECRET_NAME }))

  if (!ARN) {
    throw new Error(`Could not resolve the ARN for Secrets Manager secret "${SECRET_NAME}".`)
  }

  return ARN
}

const isAlreadyExists = (error: unknown): boolean => {
  const name = (error as { name?: string })?.name ?? ''
  const message = error instanceof Error ? error.message : String(error)

  return /already.?exists/i.test(name) || /already.?exists/i.test(message)
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
