import type { AdminViewServerProps } from 'payload'

import React from 'react'

import { SystemInfoClient } from './index.client.js'

// Import Next.js version
let nextVersion = 'unknown'
try {
  const nextPackage = await import('next/package.json')
  nextVersion = nextPackage.default.version
} catch {
  // Next.js version not available
}

// Import Payload version
let payloadVersion = 'unknown'
try {
  const payloadPackage = await import('payload/package.json')
  payloadVersion = payloadPackage.default.version
} catch {
  // Payload version not available
}

export interface SystemInfoViewProps {
  databaseAdapter: string
  nextVersion: string
  nodeEnv: string
  nodeVersion: string
  payloadVersion: string
  serverURL: string
  userName: string | undefined
}

// Map internal adapter names to user-friendly display names
const databaseAdapterDisplayNames: Record<string, string> = {
  'd1-sqlite': 'Cloudflare D1 SQLite',
  mongoose: 'MongoDB',
  postgres: 'PostgreSQL',
  sqlite: 'SQLite',
}

export function SystemInfoView({ initPageResult }: AdminViewServerProps) {
  const {
    req: {
      payload: { config },
      user,
    },
  } = initPageResult

  // Get database adapter name and map to display name
  const adapterName = config.db?.name || 'unknown'
  const databaseAdapter = databaseAdapterDisplayNames[adapterName] || adapterName

  // Strip 'v' prefix from Node.js version for consistency
  const nodeVersion = process.version.startsWith('v') ? process.version.slice(1) : process.version

  const systemInfoData: SystemInfoViewProps = {
    databaseAdapter,
    nextVersion,
    nodeEnv: process.env.NODE_ENV || 'unknown',
    nodeVersion,
    payloadVersion,
    serverURL: config.serverURL || 'Not configured',
    userName: user?.email || user?.id?.toString(),
  }

  return <SystemInfoClient {...systemInfoData} />
}
