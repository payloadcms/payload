import type { Collection, CollectionConfig, CollectionSlug, PayloadRequest } from 'payload'
import type { z } from 'zod'

export type PluginMCPServerConfig = {
  /**
   * Experimental features
   * **These features are for experimental purposes -- They are Disabled in Production by Default**
   */
  _experimental?: {
    tools: {
      auth?: {
        enabled: boolean
      }
      collections?: {
        collectionsDirPath: string
        enabled: boolean
      }
      config?: {
        configFilePath: string
        enabled: boolean
      }
      jobs?: {
        enabled: boolean
        jobsDirPath: string
      }
    }
  }
  collections?: Partial<
    Record<
      CollectionSlug,
      {
        description: string
        enabled:
          | {
              create?: boolean
              delete?: boolean
              find?: boolean
              update?: boolean
            }
          | boolean
        override?: (
          original: Record<string, unknown>,
          req: PayloadRequest,
        ) => Record<string, unknown>
      }
    >
  >
  disabled?: boolean
  mcp?: {
    handlerOptions?: MCPHandlerOptions
    serverOptions?: MCPServerOptions
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

export type MCPHandlerOptions = {
  basePath?: string
  maxDuration?: number
  redisUrl?: string
  verboseLogs?: boolean
}

export type MCPServerOptions = {
  serverInfo?: {
    name: string
    version: string
  }
}

export type ToolSettings = {
  auth?: {
    auth?: boolean
    forgotPassword?: boolean
    login?: boolean
    resetPassword?: boolean
    unlock?: boolean
    verify?: boolean
  }
  collections?: {
    create?: boolean
    delete?: boolean
    find?: boolean
    update?: boolean
  }
  config?: {
    find?: boolean
    update?: boolean
  }
  custom?: Record<string, boolean>
  jobs?: {
    create?: boolean
    run?: boolean
    update?: boolean
  }
} & Record<string, unknown>

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
