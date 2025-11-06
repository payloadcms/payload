#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { Storage } from '@google-cloud/storage'

import { registerAssetTools } from './tools/index.js'
import { getAssetResources, readAssetResource } from './resources/index.js'
import { getPayloadConfig } from './utils/config.js'

/**
 * Payload Assets MCP Server
 *
 * Provides tools and resources for managing Payload CMS assets stored in Google Cloud Storage
 */

interface ServerConfig {
  bucketName: string
  projectId?: string
  keyFilename?: string
  payloadApiUrl?: string
  payloadApiKey?: string
}

async function main() {
  const config: ServerConfig = {
    bucketName: process.env.GCS_BUCKET_NAME || '',
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_KEY_FILE,
    payloadApiUrl: process.env.PAYLOAD_API_URL || 'http://localhost:3000',
    payloadApiKey: process.env.PAYLOAD_API_KEY,
  }

  if (!config.bucketName) {
    throw new Error('GCS_BUCKET_NAME environment variable is required')
  }

  // Initialize GCS client
  const storageOptions: any = {
    projectId: config.projectId,
  }

  if (config.keyFilename) {
    storageOptions.keyFilename = config.keyFilename
  }

  const storage = new Storage(storageOptions)
  const bucket = storage.bucket(config.bucketName)

  // Initialize MCP server
  const server = new Server(
    {
      name: 'payload-assets-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  )

  // Register handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = await getAssetResources(bucket, config)
    return { resources }
  })

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const content = await readAssetResource(bucket, request.params.uri, config)
    return content
  })

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'upload_asset',
          description: 'Upload a file to Payload CMS and store it in GCS',
          inputSchema: {
            type: 'object',
            properties: {
              file_path: {
                type: 'string',
                description: 'Path to the file to upload',
              },
              collection: {
                type: 'string',
                description: 'Target collection (e.g., "media")',
                default: 'media',
              },
              alt: {
                type: 'string',
                description: 'Alt text for the image',
              },
            },
            required: ['file_path'],
          },
        },
        {
          name: 'list_assets',
          description: 'List all assets from Payload CMS',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'Collection to list from (e.g., "media")',
                default: 'media',
              },
              limit: {
                type: 'number',
                description: 'Number of results to return',
                default: 10,
              },
              page: {
                type: 'number',
                description: 'Page number for pagination',
                default: 1,
              },
            },
          },
        },
        {
          name: 'get_asset',
          description: 'Get details of a specific asset by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Asset ID',
              },
              collection: {
                type: 'string',
                description: 'Collection name (e.g., "media")',
                default: 'media',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'delete_asset',
          description: 'Delete an asset from Payload CMS and GCS',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Asset ID to delete',
              },
              collection: {
                type: 'string',
                description: 'Collection name (e.g., "media")',
                default: 'media',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'update_asset',
          description: 'Update asset metadata in Payload CMS',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Asset ID to update',
              },
              collection: {
                type: 'string',
                description: 'Collection name (e.g., "media")',
                default: 'media',
              },
              alt: {
                type: 'string',
                description: 'New alt text',
              },
              filename: {
                type: 'string',
                description: 'New filename',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'search_assets',
          description: 'Search assets by filename or metadata',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              collection: {
                type: 'string',
                description: 'Collection to search in',
                default: 'media',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_asset_url',
          description: 'Get the public URL for an asset',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Asset filename',
              },
              signed: {
                type: 'boolean',
                description: 'Generate a signed URL for private assets',
                default: false,
              },
              expiresIn: {
                type: 'number',
                description: 'Expiration time in minutes for signed URLs',
                default: 60,
              },
            },
            required: ['filename'],
          },
        },
      ],
    }
  })

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tools = registerAssetTools(bucket, config)
    const tool = tools[request.params.name]

    if (!tool) {
      throw new Error(`Unknown tool: ${request.params.name}`)
    }

    return await tool(request.params.arguments)
  })

  // Start server
  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('Payload Assets MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})
