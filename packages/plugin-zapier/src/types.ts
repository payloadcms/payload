export interface PluginConfig {
  collections: string[]
  webhookURL: string
}

export type Zap = (options: {
  collectionSlug: string
  operation: 'create' | 'update' | 'delete'
  data: unknown
  webhookEndpoint: string
}) => void
