import type { CollectionSlug } from 'payload'
import type { z } from 'zod'

export type PluginMcpServerConfig = {
  collections?: Partial<Record<CollectionSlug, true>>
  collectionsDirPath?: string
  configFilePath?: string
  disabled?: boolean
  jobsDirPath?: string
  mcp?: {
    handlerOptions?: McpHandlerOptions
    serverOptions?: McpServerOptions
    tools?: {
      description: string
      handler: (args: Record<string, unknown>) => Promise<{
        content: Array<{
          text: string
          type: 'text'
        }>
      }>
      name: string
      parameters: z.ZodRawShape
    }[]
  }
}

export type McpHandlerOptions = {
  basePath?: string
  maxDuration?: number
  redisUrl?: string
  verboseLogs?: boolean
}

export type McpServerOptions = {
  serverInfo?: {
    name: string
    version: string
  }
}

export type GlobalSettings = {
  endpoint: {
    basePath: string
    maxDuration: number
    serverInfo: {
      name: string
      version: string
    }
    verboseLogs: boolean
  }
  tools: {
    auth: {
      auth: boolean
      forgotPassword: boolean
      login: boolean
      resetPassword: boolean
      unlock: boolean
      verify: boolean
    }
    collections: {
      create: boolean
      delete: boolean
      find: boolean
      update: boolean
    }
    config: {
      find: boolean
      update: boolean
    }
    custom?: Record<string, boolean>
    jobs: {
      create: boolean
      run: boolean
      update: boolean
    }
    resources: {
      create: boolean
      delete: boolean
      find: boolean
      update: boolean
    }
  }
}

export type FieldDefinition = {
  description?: string
  name: string
  options?: { label: string; value: string }[]
  position?: 'main' | 'sidebar'
  required?: boolean
  type: string
}

export type FieldModification = {
  changes: {
    description?: string
    options?: { label: string; value: string }[]
    position?: 'main' | 'sidebar'
    required?: boolean
    type?: string
  }
  fieldName: string
}

export type CollectionConfigUpdates = {
  access?: {
    create?: string
    delete?: string
    read?: string
    update?: string
  }
  description?: string
  slug?: string
  timestamps?: boolean
  versioning?: boolean
}

export type AdminConfig = {
  avatar?: string
  css?: string
  dateFormat?: string
  inactivityRoute?: string
  livePreview?: {
    breakpoints?: Array<{
      height: number
      label: string
      name: string
      width: number
    }>
  }
  logoutRoute?: string
  meta?: {
    favicon?: string
    ogImage?: string
    titleSuffix?: string
  }
  user?: string
}

export type DatabaseConfig = {
  connectOptions?: string
  type?: 'mongodb' | 'postgres'
  url?: string
}

export type PluginUpdates = {
  add?: string[]
  remove?: string[]
}

export type GeneralConfig = {
  cookiePrefix?: string
  cors?: string
  csrf?: string
  graphQL?: {
    disable?: boolean
    schemaOutputFile?: string
  }
  rateLimit?: {
    max?: number
    skip?: string
    window?: number
  }
  secret?: string
  serverURL?: string
  typescript?: {
    declare?: boolean
    outputFile?: string
  }
}

export interface SchemaField {
  description?: string
  name: string
  options?: string[]
  required?: boolean
  type: string
}

export interface TaskSequenceItem {
  description?: string
  retries?: number
  taskId: string
  taskSlug: string
  timeout?: number
}

export interface JobConfigUpdate {
  description?: string
  queue?: string
  retries?: number
  timeout?: number
}

// Figma
export type FigmaSettings = {
  credentials?: {
    apiToken?: string
    baseUrl?: string
    teamId?: string
    webhookSecret?: string
  }
  tools?: {
    getComments?: boolean
    getFile?: boolean
    getFileMetadata?: boolean
    getFileNodes?: boolean
    getFileStyles?: boolean
    getFileVersions?: boolean
    getImageFills?: boolean
    getImages?: boolean
    getProjects?: boolean
    getUsers?: boolean
  }
}
