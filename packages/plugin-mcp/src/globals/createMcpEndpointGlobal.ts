import type { GlobalConfig } from 'payload'

export const createMcpEndpointGlobal = (): GlobalConfig => {
  return {
    slug: 'payload-mcp-endpoint',
    admin: {
      group: 'MCP',
    },
    fields: [
      {
        name: 'serverInfo',
        type: 'group',
        fields: [
          {
            name: 'name',
            type: 'text',
            admin: {
              description: 'The name of the MCP server.',
            },
            defaultValue: 'Payload MCP',
          },
          {
            name: 'version',
            type: 'text',
            admin: {
              description: 'The version of the MCP server.',
            },
            defaultValue: '0.1.0',
          },
        ],
      },
      {
        name: 'basePath',
        type: 'text',
        admin: {
          description: 'The base path for the MCP server. This is set automatically by the plugin.',
          readOnly: true,
        },
        defaultValue: '/api',
      },
      {
        name: 'maxDuration',
        type: 'number',
        admin: {
          description: 'The maximum transaction duration.',
        },
        defaultValue: 60,
      },
      {
        name: 'verboseLogs',
        type: 'checkbox',
        admin: {
          description: 'Enable verbose logs.',
        },
        defaultValue: false,
      },
    ],
    label: 'Endpoint',
  }
}
